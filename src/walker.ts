import { isArray, isMap, isPlainObject, isPrimitive, isSet } from './is';
import { Tree } from './pathtree';
import {
  isInstanceOfRegisteredClass,
  transformValue,
  TypeAnnotation,
} from './transformer';
import { includes, forEach } from './util';

interface WalkerValue {
  isLeaf: boolean;
  path: any[];
  node: any;
}

export type Walker = (v: WalkerValue) => any;

const isDeep = (object: any): boolean =>
  isPlainObject(object) ||
  isArray(object) ||
  isMap(object) ||
  isSet(object) ||
  isInstanceOfRegisteredClass(object);

interface Result {
  transformedValue: any;
  annotations?: Tree<TypeAnnotation | null>;
}

function addIdentity(
  object: any,
  path: any[],
  identities: Map<any, Set<any[]>>
) {
  const existingSet = identities.get(object);

  if (existingSet) {
    existingSet.add(path);
  } else {
    identities.set(object, new Set([path]));
  }
}

export const walker = (
  object: any,
  path: any[] = [],
  objectsInThisPath: any[] = [],
  identities: Map<any, Set<any[]>> = new Map()
): Result => {
  if (!isPrimitive(object)) {
    addIdentity(object, path, identities);
  }

  if (!isDeep(object)) {
    const transformed = transformValue(object);
    if (transformed) {
      return {
        transformedValue: transformed.value,
        annotations: [transformed.type],
      };
    } else {
      return {
        transformedValue: object,
      };
    }
  }

  if (includes(objectsInThisPath, object)) {
    return {
      transformedValue: null,
    };
  }

  const transformed = transformValue(object) ?? { value: object, type: null };

  if (!isPrimitive(transformed.value)) {
    objectsInThisPath = [...objectsInThisPath, transformed.value];
  }

  const transformedValue: any = isArray(transformed.value) ? [] : {};
  const innerAnnotations: Record<string, Tree<TypeAnnotation | null>> = {};

  forEach(transformed.value, (value, index) => {
    const recursiveResult = walker(
      value,
      [...path, index],
      objectsInThisPath,
      identities
    );

    transformedValue[index] = recursiveResult.transformedValue;

    if (recursiveResult.annotations) {
      innerAnnotations[index] = recursiveResult.annotations;
    }
  });

  return {
    transformedValue,
    annotations: [transformed.type, innerAnnotations],
  };
};
