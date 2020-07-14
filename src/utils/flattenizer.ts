// based on https://github.com/sahellebusch/flattenizer/blob/master/src/flattenizer.ts

type Nullable<A> = A | null | undefined;

interface IFlattened<P> {
  [path: string]: P;
}

interface IUnflattened<P> {
  [key: string]: P | P[] | IUnflattened<P>;
}

const escapeKey = (key: string): string => {
  return key.replace(/\./g, '\\.');
};

export const flatten = <A extends IFlattened<any>, B extends IUnflattened<any>>(
  unflattened: Nullable<B>
): Nullable<A> => {
  if (unflattened === undefined) {
    return undefined;
  }

  if (unflattened === null) {
    return null;
  }

  if (typeof unflattened !== 'object') {
    throw new TypeError('unflattened is not an object');
  }

  const flattened: A = Object.keys(unflattened).reduce((acc, key) => {
    const value = unflattened[key];
    if (typeof value === 'object' && value !== null) {
      const flatObject = flatten(value);

      for (const subKey in flatObject) {
        //@ts-expect-error
        acc[`${escapeKey(key)}.${subKey}`] = flatObject[subKey];
      }
    } else {
      //@ts-expect-error
      acc[escapeKey(key)] = value;
    }

    return acc;
  }, {}) as A;

  return flattened;
};

export const unescapeKey = (k: string) => k.replace(/\\\./g, '.');

const explodeProperty = (
  currUnflattened: object,
  key: string,
  flattenedObj: object
): void => {
  const keys = key.split(/(?<!\\)\./g).map(unescapeKey);
  // @ts-expect-error
  const value = flattenedObj[key];
  const lastKeyIndex = keys.length - 1;

  for (let idx = 0; idx < lastKeyIndex; idx++) {
    const currKey = keys[idx];
    let nextKeyVal;

    if (!currUnflattened.hasOwnProperty(currKey)) {
      nextKeyVal = parseInt(keys[idx + 1], 10);
      // @ts-expect-error
      currUnflattened[currKey] = isNaN(nextKeyVal) ? {} : [];
    }

    // @ts-expect-error
    currUnflattened = currUnflattened[currKey];
  }

  // @ts-expect-error
  currUnflattened[keys[lastKeyIndex]] = value;
};

export const unflatten = <
  A extends IFlattened<any>,
  B extends IUnflattened<any>
>(
  flattened: Nullable<A>
): Nullable<B> => {
  if (flattened === undefined) {
    return undefined;
  }

  if (flattened === null) {
    return null;
  }
  if (typeof flattened !== 'object') {
    throw new TypeError('flattened is not an object');
  }

  const unflattened: B = Object.keys(flattened).reduce((acc, key) => {
    explodeProperty(acc, key, flattened);
    return acc;
  }, {} as B);

  return unflattened;
};
