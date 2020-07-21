import is from '@sindresorhus/is';

interface WalkerValue {
  isLeaf: boolean;
  path: any[];
  node: any;
}

export type Walker = (v: WalkerValue) => any;

const isDeep = (object: any): boolean =>
  is.plainObject(object) ||
  is.array(object) ||
  is.map(object) ||
  is.set(object);

const entries = (object: object | Map<any, any>): [any, any][] => {
  if (is.map(object)) {
    return [...object.entries()];
  }

  if (is.plainObject(object)) {
    return Object.entries(object);
  }

  throw new Error('Illegal Argument: ' + typeof object);
};

export const plainer = (
  object: any,
  walker: Walker,
  path: any[] = [],
  alreadySeenObjects = new Set<any>()
): any => {
  if (!isDeep(object)) {
    return walker({ isLeaf: true, node: object, path });
  }

  if (alreadySeenObjects.has(object)) {
    throw new TypeError('Circular Reference');
  }

  if (!is.primitive(object)) {
    alreadySeenObjects.add(object);
  }

  walker({ isLeaf: false, path, node: object });

  if (is.array(object) || is.set(object)) {
    return [...object].map((value, key) =>
      plainer(value, walker, [...path, key], alreadySeenObjects)
    );
  }

  if (is.plainObject(object) || is.map(object)) {
    return Object.fromEntries(
      entries(object).map(([key, value]) => [
        key,
        plainer(value, walker, [...path, key], alreadySeenObjects),
      ])
    );
  }
};
