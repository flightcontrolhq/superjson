import is from '@sindresorhus/is';

import {
  objectHasArrayLikeKeys,
  transformValue,
  untransformValue,
} from './transformer';

const isDeep = (object: any): boolean =>
  is.plainObject(object) ||
  is.array(object) ||
  is.map(object) ||
  is.set(object);

const isNonEmptyFlat = (object: any): boolean => is.plainObject(object);

export const entries = (object: any): [any, any][] => {
  if (is.array(object)) {
    return object.map((v, i) => [i, v]);
  }

  if (is.set(object)) {
    return [...object].map((v, i) => [i, v]);
  }

  if (is.map(object)) {
    return [...object.entries()];
  }

  if (is.plainObject(object)) {
    return Object.entries(object);
  }

  throw new Error('Illegal Argument: ' + typeof object);
};

type LeafTypeAnnotation =
  | 'regexp'
  | 'NaN'
  | '-Infinity'
  | 'Infinity'
  | 'undefined'
  | 'bigint'
  | 'Date';

const LEAF_TYPE_ANNOTATIONS: LeafTypeAnnotation[] = [
  'regexp',
  'NaN',
  '-Infinity',
  'Infinity',
  'undefined',
];

type ContainerTypeAnnotation = 'object' | 'map' | 'set';

export type TypeAnnotation = LeafTypeAnnotation | ContainerTypeAnnotation;

const isLeafTypeAnnotation = (
  type: TypeAnnotation
): type is LeafTypeAnnotation => LEAF_TYPE_ANNOTATIONS.includes(type as any);

export const escapeKey = (key: string) => key.replace(/\./g, '\\.');

export type Flattened = Record<string, any> | null | undefined;

export type FlattenAnnotations = Record<string, TypeAnnotation>;

export const flattenAndSerialize = (
  unflattened: any,
  objectsAlreadySeen = new Set<object>()
): { output: Flattened; annotations: FlattenAnnotations } => {
  if (!isDeep(unflattened)) {
    const transformed = transformValue(unflattened);
    let output = !!transformed ? transformed.value : unflattened;
    const annotations: FlattenAnnotations = !!transformed
      ? { '': transformed.type }
      : {};

    return { output, annotations };
  }

  const flattened: Flattened = {};
  const annotations: FlattenAnnotations = {};

  const transformed = transformValue(unflattened);

  if (!!transformed) {
    annotations[''] = transformed.type;
  }

  for (const [key, value] of entries(unflattened)) {
    if (objectsAlreadySeen.has(value)) {
      throw new TypeError('Circular Reference');
    }

    if (!is.primitive(value)) {
      objectsAlreadySeen.add(value);
    }

    const escapedKey = escapeKey('' + key);

    if (isDeep(value)) {
      const {
        output: flattenedSubObject,
        annotations: subObjectAnnotations,
      } = flattenAndSerialize(value, objectsAlreadySeen);

      const fullKey = (subKey: string) =>
        subKey === '' ? escapedKey : escapedKey + '.' + subKey;

      for (const [subKey, subValue] of Object.entries(
        flattenedSubObject as any
      )) {
        flattened[fullKey(subKey)] = subValue;
      }

      for (const [subKey, subAnnotation] of Object.entries(
        subObjectAnnotations
      )) {
        annotations[fullKey(subKey)] = subAnnotation;
      }
    } else {
      const {
        output: flattenedSubObject,
        annotations: subObjectAnnotations,
      } = flattenAndSerialize(value, objectsAlreadySeen);
      flattened[escapedKey] = flattenedSubObject;

      if (subObjectAnnotations['']) {
        annotations[escapedKey] = subObjectAnnotations[''];
      }
    }
  }

  return { output: flattened, annotations };
};

export const minimizeFlattened = (flattened: Flattened): Flattened => {
  if (!isNonEmptyFlat(flattened)) {
    return flattened;
  }

  return Object.fromEntries(
    Object.entries(flattened!).filter(([_key, value]) => {
      return !isDeep(value);
    })
  );
};

const mapDeep = (
  object: object,
  path: string[],
  mapper: (v: any) => any
): object => {
  if (path.length < 1) {
    throw new Error('Illegal Argument');
  }

  const [head, ...tail] = path;

  if (path.length === 1) {
    if (head === '') {
      return mapper(object);
    }

    return {
      ...object,
      [head]: mapper((object as any)[head]),
    };
  }

  return {
    ...object,
    [head]: mapDeep((object as any)[head] ?? {}, tail, mapper),
  };
};

/**
 a bit like `mkdir -p`, but for objects
 */
export const setDeep = (object: any, path: string[], value: any) =>
  mapDeep(object, path, () => value);

/**
 * beware: may mutate the original object
 */
export const deepConvertArrayLikeObjects = (object: object): object => {
  if (objectHasArrayLikeKeys(object)) {
    object = Object.values(object);
  }

  for (const [key, value] of Object.entries(object)) {
    if (is.plainObject(value)) {
      (object as any)[key] = deepConvertArrayLikeObjects(value);
    }
  }

  return object;
};

const unescapeKey = (k: string) => k.replace(/\\\./g, '.');

export const keyToPath = (key: string) =>
  key.split(/(?<!\\)\./g).map(unescapeKey);

const partition = <T>(arr: T[], goesLeft: (v: T) => boolean): [T[], T[]] => {
  const left: T[] = [];
  const right: T[] = [];

  for (const v of arr) {
    if (goesLeft(v)) {
      left.push(v);
    } else {
      right.push(v);
    }
  }

  return [left, right];
};

export const deserializeFlattened = (
  flattened: any,
  annotations: FlattenAnnotations
): any => {
  if (!isNonEmptyFlat(flattened)) {
    if (annotations['']) {
      return untransformValue(flattened, annotations['']);
    }
    return flattened;
  }

  let unflattened = {};

  for (const [key, value] of Object.entries(flattened)) {
    unflattened = setDeep(unflattened, keyToPath(key), value);
  }

  const applyAnnotation = ([key, type]: [string, TypeAnnotation]) => {
    unflattened = mapDeep(unflattened, keyToPath(key), v =>
      untransformValue(v, type)
    );
  };

  const [
    leafTypeAnnotations,
    innerNodeTypeAnnotations,
  ] = partition(Object.entries(annotations), ([_path, type]) =>
    isLeafTypeAnnotation(type)
  );

  leafTypeAnnotations.forEach(applyAnnotation);

  unflattened = deepConvertArrayLikeObjects(unflattened);

  innerNodeTypeAnnotations.forEach(applyAnnotation);

  return unflattened;
};
