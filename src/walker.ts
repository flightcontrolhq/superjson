import {
  isArray,
  isEmptyObject,
  isMap,
  isPlainObject,
  isPrimitive,
  isSet,
} from './is';
import { escapeKey } from './pathstringifier';
import { PathTree, Tree } from './pathtree';
import {
  isInstanceOfRegisteredClass,
  transformValue,
  TypeAnnotation,
} from './transformer';
import { includes, forEach } from './util';

const isDeep = (object: any): boolean =>
  isPlainObject(object) ||
  isArray(object) ||
  isMap(object) ||
  isSet(object) ||
  isInstanceOfRegisteredClass(object);

function addIdentity(object: any, path: any[], identities: Map<any, any[][]>) {
  const existingSet = identities.get(object);

  if (existingSet) {
    existingSet.push(path);
  } else {
    identities.set(object, [path]);
  }
}

interface Result {
  transformedValue: any;
  annotations?: PathTree.CollapsedRootTree<TypeAnnotation>;
}

export const walker = (
  object: any,
  identities: Map<any, any[][]> = new Map(),
  path: any[] = [],
  objectsInThisPath: any[] = []
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

  const transformationResult = transformValue(object);
  const transformed = transformationResult?.value ?? object;

  if (!isPrimitive(object)) {
    objectsInThisPath = [...objectsInThisPath, object];
  }

  const transformedValue: any = isArray(transformed) ? [] : {};
  const innerAnnotations: Record<string, Tree<TypeAnnotation>> = {};

  forEach(transformed, (value, index) => {
    const recursiveResult = walker(
      value,
      identities,
      [...path, index],
      objectsInThisPath
    );

    transformedValue[index] = recursiveResult.transformedValue;

    if (isArray(recursiveResult.annotations)) {
      innerAnnotations[index] = recursiveResult.annotations;
    } else if (isPlainObject(recursiveResult.annotations)) {
      forEach(recursiveResult.annotations, (tree, key) => {
        innerAnnotations[escapeKey(index) + '.' + key] = tree;
      });
    }
  });

  if (isEmptyObject(innerAnnotations)) {
    return {
      transformedValue,
      annotations: !!transformationResult
        ? [transformationResult.type]
        : undefined,
    };
  } else {
    return {
      transformedValue,
      annotations: !!transformationResult
        ? [transformationResult.type, innerAnnotations]
        : innerAnnotations,
    };
  }
};
