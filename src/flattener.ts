import is from '@sindresorhus/is';

import {
  escapeKey,
  deepConvertArrayLikeObjects,
  Flattened,
  keyToPath,
  setDeep,
} from './serializer';

export const flatten = (object: object): Record<string, any> => {
  if (!(is.plainObject(object) || is.array(object))) {
    return { '': object };
  }

  const flattened: Record<string, any> = {};

  for (const [key, value] of Object.entries(object)) {
    const escapedKey = escapeKey(key);
    const flattenedSub = flatten(value as any);

    for (const [subkey, subValue] of Object.entries(flattenedSub)) {
      const fullKey = subkey === '' ? escapedKey : escapedKey + '.' + subkey;
      flattened[fullKey] = subValue;
    }
  }

  return flattened;
};

export const unflatten = (object: Flattened): object => {
  let unflattened = {};

  for (const [key, value] of Object.entries(object as any)) {
    const path = keyToPath(key);
    unflattened = setDeep(unflattened, path, value);
  }

  deepConvertArrayLikeObjects(unflattened);

  return unflattened;
};
