import is from '@sindresorhus/is';
import * as IteratorUtils from "./iteratorutils"

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

const entries = (object: object | Map<any, any>): Iterator<[any, any]> => {
  if (is.map(object)) {
    return object.entries();
  }

  if (is.plainObject(object)) {
    return Object.entries(object).values()
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
    return IteratorUtils.map(object.values(), (value, index) =>
    plainer(value, walker, [...path, index], alreadySeenObjects)
  );
  }

  if (is.plainObject(object) || is.map(object)) {
    return Object.fromEntries(IteratorUtils.map(entries(object), ([key, value]) => [
      key,
      plainer(value, walker, [...path, key], alreadySeenObjects),
    ]));
  }
};
