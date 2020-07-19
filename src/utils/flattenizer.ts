import is from '@sindresorhus/is';

function isDeep(object: any): boolean {
  return (
    is.plainObject(object) ||
    is.array(object) ||
    is.map(object) ||
    is.set(object)
  );
}

function isNonEmptyFlat(object: any): boolean {
  return is.plainObject(object);
}

export function entries(object: any): [any, any][] {
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
}

type LeafTypeAnnotation =
  | 'regexp'
  | 'NaN'
  | '-Infinity'
  | 'Infinity'
  | 'undefined';
type ContainerTypeAnnotation = 'object' | 'map' | 'set';
type TypeAnnotation = LeafTypeAnnotation | ContainerTypeAnnotation;

function getType(value: any): LeafTypeAnnotation | undefined {
  if (is.regExp(value)) {
    return 'regexp';
  }

  if (is.undefined(value)) {
    return 'undefined';
  }

  return undefined;
}

const escapeKey = (key: string): string => {
  return key.replace(/\./g, '\\.');
};

type Flattened = Record<string, any> | null | undefined;

export type FlattenAnnotations = Record<string, TypeAnnotation>;

export function flatten(
  unflattened: any,
  objectsAlreadySeen = new Set<object>()
): { output: Flattened; annotations: FlattenAnnotations } {
  if (!isDeep(unflattened)) {
    const type = getType(unflattened);
    const annotations: FlattenAnnotations = !!type ? { '': type } : {};
    return { output: unflattened, annotations };
  }

  const flattened: Flattened = {};
  const annotations: FlattenAnnotations = {};

  if (is.plainObject(unflattened) && objectHasArrayLikeKeys(unflattened)) {
    annotations[''] = 'object';
  }

  if (is.set(unflattened)) {
    annotations[''] = 'set';
  }

  if (is.map(unflattened)) {
    annotations[''] = 'map';
  }

  for (const [key, value] of entries(unflattened)) {
    if (objectsAlreadySeen.has(value)) {
      throw new TypeError('Circular Reference');
    }

    objectsAlreadySeen.add(value);

    const escapedKey = escapeKey('' + key);

    if (isDeep(value)) {
      const {
        output: flattenedSubObject,
        annotations: subObjectAnnotations,
      } = flatten(value, objectsAlreadySeen);

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
      } = flatten(value, objectsAlreadySeen);
      flattened[escapedKey] = flattenedSubObject;
      if (subObjectAnnotations['']) {
        annotations[escapedKey] = subObjectAnnotations[''];
      }
    }
  }

  return { output: flattened, annotations };
}

export function minimizeFlattened(flattened: Flattened): Flattened {
  if (!isNonEmptyFlat(flattened)) {
    return flattened;
  }

  return Object.fromEntries(
    Object.entries(flattened!).filter(([_key, value]) => {
      return !isDeep(value);
    })
  );
}

/**
 * a bit like `mkdir -p`, but for objects
 */
export function setDeep(objectToMutate: any, path: string[], value: any): void {
  if (path.length < 1) {
    throw new Error('Illegal Argument');
  }

  const [head, ...tail] = path;

  if (path.length === 1) {
    objectToMutate[head] = value;
    return;
  }

  objectToMutate[head] = objectToMutate[head] ?? {};
  setDeep(objectToMutate[head], tail, value);
}

export function objectHasArrayLikeKeys(object: object): boolean {
  return areKeysArrayLike(Object.keys(object));
}

/**
 * keys are expected to be sorted alphanumerically.
 */
export function areKeysArrayLike(keys: string[]): boolean {
  const numberKeys: number[] = [];

  for (const key of keys) {
    const keyAsInt = parseInt(key);

    if (is.nan(keyAsInt)) {
      return false;
    }

    numberKeys.push(keyAsInt);
  }

  return numberKeys.every((value, index) => value === index);
}

/**
 * beware: may mutate the original object
 */
export function deepConvertArrayLikeObjects(object: object): object {
  if (objectHasArrayLikeKeys(object)) {
    object = Object.values(object);
  }

  for (const [key, value] of Object.entries(object)) {
    if (is.plainObject(value)) {
      (object as any)[key] = deepConvertArrayLikeObjects(value);
    }
  }

  return object;
}

const unescapeKey = (k: string) => k.replace(/\\\./g, '.');

export const unflatten = (flattenedMinimal: any): any => {
  if (!isNonEmptyFlat(flattenedMinimal)) {
    return flattenedMinimal;
  }

  const unflattened = {};

  for (const [key, value] of Object.entries(flattenedMinimal)) {
    const path = key.split(/(?<!\\)\./g).map(unescapeKey);
    setDeep(unflattened, path, value);
  }

  deepConvertArrayLikeObjects(unflattened);

  return unflattened;
};
