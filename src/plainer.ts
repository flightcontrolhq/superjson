import { isArray, isMap, isPlainObject, isPrimitive, isSet } from './is';
import { isInstanceOfRegisteredClass } from './transformer';
import { includes, mapValues } from './util';

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

export const plainer = (
  object: any,
  walker: Walker,
  path: any[] = [],
  alreadySeenObjects: any[] = []
): any => {
  if (!isDeep(object)) {
    return walker({ isLeaf: true, node: object, path });
  }

  object = walker({ isLeaf: false, path, node: object });

  if (includes(alreadySeenObjects, object)) {
    return null;
  }

  if (!isPrimitive(object)) {
    alreadySeenObjects = [...alreadySeenObjects, object];
  }

  if (isArray(object)) {
    return object.map((value, index) =>
      plainer(value, walker, [...path, index], alreadySeenObjects)
    );
  }

  if (isPlainObject(object)) {
    return mapValues(object, (value, key) =>
      plainer(value, walker, [...path, key], alreadySeenObjects)
    );
  }
};
