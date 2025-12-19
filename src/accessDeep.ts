import { isArray, isPlainObject } from './is.js';
import { includes } from './util.js';

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
    object = (object as any)[key];
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
