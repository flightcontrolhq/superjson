import { isMap, isArray, isPlainObject, isSet } from './is.js';
import { includes } from './util.js';

const getNthKey = (value: Map<any, any> | Set<any>, n: number): any => {
  if (n > value.size) throw new Error('index out of bounds');
  const keys = value.keys();
  while (n > 0) {
    keys.next();
    n--;
  }

  return keys.next().value;
};

function validatePath(path: (string | number)[]) {
  if (includes(path, '__proto__')) {
    throw new Error('__proto__ is not allowed as a property');
  }
  if (includes(path, 'prototype')) {
    throw new Error('prototype is not allowed as a property');
  }
  if (includes(path, 'constructor')) {
    throw new Error('constructor is not allowed as a property');
  }
}

export const getDeep = (object: object, path: (string | number)[]): object => {
  validatePath(path);

  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    if (isSet(object)) {
      object = getNthKey(object, +key);
    } else if (isMap(object)) {
      const row = +key;
      const type = +path[++i] === 0 ? 'key' : 'value';

      const keyOfRow = getNthKey(object, row);
      switch (type) {
        case 'key':
          object = keyOfRow;
          break;
        case 'value':
          object = object.get(keyOfRow);
          break;
      }
    } else {
      object = (object as any)[key];
    }
  }

  return object;
};

export const setDeep = (
  object: any,
  path: (string | number)[],
  mapper: (v: any) => any
): any => {
  validatePath(path);

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
    }
  }

  const lastKey = path[path.length - 1];

  if (isArray(parent)) {
    parent[+lastKey] = mapper(parent[+lastKey]);
  } else if (isPlainObject(parent)) {
    parent[lastKey] = mapper(parent[lastKey]);
  }

  return object;
};
