import { isMap, isArray, isPlainObject, isSet } from './is.js';
import { includes } from './util.js';

export type AccessDeepContext = WeakMap<object, any[]>;

const getNthKey = (
  value: Map<any, any> | Set<any>,
  n: number,
  context: AccessDeepContext
): any => {
  let indexed = context.get(value);
  if (!indexed) {
    indexed = Array.from(value.keys());
    context.set(value, indexed);
  }

  if (!Number.isInteger(n) || n < 0 || n >= indexed.length) {
    throw new Error('index out of bounds');
  }

  return indexed[n];
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

export const getDeep = (
  object: object,
  path: (string | number)[],
  context: AccessDeepContext
): object => {
  validatePath(path);

  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    if (isSet(object)) {
      object = getNthKey(object, +key, context);
    } else if (isMap(object)) {
      const row = +key;
      const type = +path[++i] === 0 ? 'key' : 'value';

      const keyOfRow = getNthKey(object, row, context);
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
  mapper: (v: any) => any,
  context: AccessDeepContext
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
    } else if (isSet(parent)) {
      const row = +key;
      parent = getNthKey(parent, row, context);
    } else if (isMap(parent)) {
      const isEnd = i === path.length - 2;
      if (isEnd) {
        break;
      }

      const row = +key;
      const type = +path[++i] === 0 ? 'key' : 'value';

      const keyOfRow = getNthKey(parent, row, context);
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

  if (isArray(parent)) {
    parent[+lastKey] = mapper(parent[+lastKey]);
  } else if (isPlainObject(parent)) {
    parent[lastKey] = mapper(parent[lastKey]);
  }

  if (isSet(parent)) {
    const row = +lastKey;
    const oldValue = getNthKey(parent, row, context);
    const newValue = mapper(oldValue);
    
    if (oldValue !== newValue) {
      parent.delete(oldValue);
      parent.add(newValue);

      const currentContext = context.get(parent);
      if (currentContext) {
        currentContext[row] = newValue;
      }
    }
  }

  if (isMap(parent)) {
    const row = +path[path.length - 2];
    const keyToRow = getNthKey(parent, row, context);

    const type = +lastKey === 0 ? 'key' : 'value';
    switch (type) {
      case 'key': {
        const newKey = mapper(keyToRow);
        parent.set(newKey, parent.get(keyToRow));

        if (newKey !== keyToRow) {
          parent.delete(keyToRow);

          const currentContext = context.get(parent);
          if (currentContext) {
            currentContext[row] = newKey;
          }
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
