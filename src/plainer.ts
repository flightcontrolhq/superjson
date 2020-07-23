import { isArray, isMap, isPlainObject, isPrimitive, isSet } from './is';

interface WalkerValue {
  isLeaf: boolean;
  path: any[];
  node: any;
}

export type Walker = (v: WalkerValue) => any;

const isDeep = (object: any): boolean =>
  isPlainObject(object) || isArray(object) || isMap(object) || isSet(object);

const entries = (object: object | Map<any, any>): [any, any][] => {
  if (isMap(object)) {
    return [...object.entries()];
  }

  if (isPlainObject(object)) {
    return Object.entries(object);
  }

  throw new Error('Illegal Argument: ' + typeof object);
};

export const plainer = (
  object: any,
  walker: Walker,
  path: any[] = [],
  alreadySeenObjects: any[] = []
): any => {
  if (!isDeep(object)) {
    return walker({ isLeaf: true, node: object, path });
  }

  walker({ isLeaf: false, path, node: object });

  if (alreadySeenObjects.includes(object)) {
    return null;
  }

  if (!isPrimitive(object)) {
    alreadySeenObjects = [...alreadySeenObjects, object]
  }

  if (isArray(object) || isSet(object)) {
    return [...object].map((value, key) =>
      plainer(value, walker, [...path, key], alreadySeenObjects)
    );
  }

  if (isPlainObject(object) || isMap(object)) {
    return Object.fromEntries(
      entries(object).map(([key, value]) => [
        key,
        plainer(value, walker, [...path, key], alreadySeenObjects),
      ])
    );
  }
};
