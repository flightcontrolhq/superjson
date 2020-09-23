import { isArray, isMap, isPlainObject, isPrimitive, isSet } from './is';
import { mapValues, values, includes, entries } from 'lodash';

interface WalkerValue {
  isLeaf: boolean;
  path: any[];
  node: any;
}

export type Walker = (v: WalkerValue) => any;

const isDeep = (object: any): boolean =>
  isPlainObject(object) || isArray(object) || isMap(object) || isSet(object);

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

  if (includes(alreadySeenObjects, object)) {
    return null;
  }

  if (!isPrimitive(object)) {
    alreadySeenObjects = [...alreadySeenObjects, object];
  }

  if (isArray(object)) {
    return values(object).map((value, index) =>
      plainer(value, walker, [...path, index], alreadySeenObjects)
    );
  }

  if (isSet(object)) {
    return entries(object).map(([value], index) =>
      plainer(value, walker, [...path, index], alreadySeenObjects)
    );
  }

  if (isMap(object)) {
    return entries(object).map(([key, value], index) => [
      plainer(key, walker, [...path, index, 0], alreadySeenObjects),
      plainer(value, walker, [...path, index, 1], alreadySeenObjects),
    ]);
  }

  if (isPlainObject(object)) {
    return mapValues(object, (value, key) =>
      plainer(value, walker, [...path, key], alreadySeenObjects)
    );
  }
};
