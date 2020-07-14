// based on https://github.com/sahellebusch/flattenizer/blob/master/src/flattenizer.ts

type Nullable<A> = A | null | undefined;
type Delimiter = string;

interface IFlattened<P> {
  [path: string]: P;
}

interface IUnflattened<P> {
  [key: string]: P | P[] | IUnflattened<P>;
}

export const flatten = <A extends IFlattened<any>, B extends IUnflattened<any>>(
  unflattened: Nullable<B>,
  delimiter: Delimiter = '.'
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

  if (typeof delimiter !== 'string') {
    throw new TypeError('delimiter must be a string');
  }

  const flattened: A = Object.keys(unflattened).reduce((acc, key) => {
    const value = unflattened[key];
    if (typeof value === 'object' && value !== null) {
      const flatObject = flatten(value, delimiter);

      for (const subKey in flatObject) {
        //@ts-expect-error
        acc[`${key}${delimiter}${subKey}`] = flatObject[subKey];
      }
    } else {
      //@ts-expect-error
      acc[key] = value;
    }

    return acc;
  }, {}) as A;

  return flattened;
};

const explodeProperty = (
  currUnflattened: object,
  key: string,
  flattenedObj: object,
  delimiter: string
): void => {
  const keys = key.split(delimiter);
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
  flattened: Nullable<A>,
  delimiter: Delimiter = '.'
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

  if (typeof delimiter !== 'string') {
    throw new TypeError('delimiter must be a string');
  }

  const unflattened: B = Object.keys(flattened).reduce((acc, key) => {
    explodeProperty(acc, key, flattened, delimiter);
    return acc;
  }, {} as B);

  return unflattened;
};
