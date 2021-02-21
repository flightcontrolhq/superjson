import { isMap, isArray, isPlainObject, isSet } from './is';

const getNthKey = (value: Map<any, any> | Set<any>, n: number): any => {
  const keys = value.keys();
  while (n > 0) {
    keys.next();
    n--;
  }

  return keys.next().value;
};

export const getDeep = (object: object, path: (string | number)[]): object => {
  path.forEach(key => {
    object = (object as any)[key];
  });

  return object;
};

export const setDeep = (
  object: any,
  path: (string | number)[],
  mapper: (v: any) => any
): any => {
  if (path.length === 0) {
    return mapper(object);
  }

  let parent = object;

  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];

    if (isArray(parent)) {
      const index = +key;
      parent = parent[index];
    } else if (isPlainObject(parent)) {
      parent = parent[key];
    } else if (isSet(parent)) {
      const row = +key;
      parent = getNthKey(parent, row);
    } else if (isMap(parent)) {
      const isEnd = i === path.length - 2;
      if (isEnd) {
        break;
      }

      const row = +key;
      const type = +path[++i] === 0 ? 'key' : 'value';

      const keyOfRow = getNthKey(parent, row);
      switch (type) {
        case 'key':
          parent = keyOfRow;
          break;
        case 'value':
          parent = parent.get(keyOfRow);
          break;
      }
    }
  }

  const lastKey = path[path.length - 1];

  if (isArray(parent) || isPlainObject(parent)) {
    parent[lastKey] = mapper(parent[lastKey]);
  }

  if (isSet(parent)) {
    const oldValue = getNthKey(parent, +lastKey);
    const newValue = mapper(oldValue);
    if (oldValue !== newValue) {
      parent.delete(oldValue);
      parent.add(newValue);
    }
  }

  if (isMap(parent)) {
    const row = +path[path.length - 2];
    const keyToRow = getNthKey(parent, row);

    const type = +lastKey === 0 ? 'key' : 'value';
    switch (type) {
      case 'key': {
        const newKey = mapper(keyToRow);
        parent.set(newKey, parent.get(keyToRow));

        if (newKey !== keyToRow) {
          parent.delete(keyToRow);
        }
        break;
      }

      case 'value': {
        parent.set(keyToRow, mapper(parent.get(keyToRow)));
        break;
      }
    }
  }

  return object;
};
