import { isMap, isArray, isPlainObject, isSet } from './is.js';
import { includes } from './util.js';

export type AccessDeepContext = WeakMap<object, any[]>;

const getIndexedKeys = (
  value: Map<any, any> | Set<any>,
  context: AccessDeepContext
): any[] => {
  let indexed = context.get(value);
  if (!indexed) {
    indexed = Array.from(value.keys());
    context.set(value, indexed);
  }

  return indexed;
};

const getNthKey = (
  value: Map<any, any> | Set<any>,
  n: number,
  context: AccessDeepContext
): any => {
  const indexed = getIndexedKeys(value, context);

  if (!Number.isInteger(n) || n < 0 || n >= indexed.length) {
    throw new Error('index out of bounds');
  }

  return indexed[n];
};

const rememberIndexedCollectionKeys = (
  before: unknown,
  after: unknown,
  context: AccessDeepContext
) => {
  if (!isArray(before)) {
    return;
  }

  if (isSet(after)) {
    context.set(after, before.slice());
    return;
  }

  if (isMap(after)) {
    context.set(
      after,
      before.map(entry => (isArray(entry) ? entry[0] : undefined))
    );
  }
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
    const mapped = mapper(object);
    rememberIndexedCollectionKeys(object, mapped, context);
    return mapped;
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
    const oldValue = parent[+lastKey];
    const newValue = mapper(oldValue);
    parent[+lastKey] = newValue;
    rememberIndexedCollectionKeys(oldValue, newValue, context);
  } else if (isPlainObject(parent)) {
    const oldValue = parent[lastKey];
    const newValue = mapper(oldValue);
    parent[lastKey] = newValue;
    rememberIndexedCollectionKeys(oldValue, newValue, context);
  }

  if (isSet(parent)) {
    const row = +lastKey;
    const indexed = getIndexedKeys(parent, context);
    if (!Number.isInteger(row) || row < 0 || row >= indexed.length) {
      throw new Error('index out of bounds');
    }
    const oldValue = indexed[row];

    const newValue = mapper(oldValue);
    rememberIndexedCollectionKeys(oldValue, newValue, context);

    if (oldValue !== newValue) {
      if (row < parent.size) {
        parent.delete(oldValue);
      }
      parent.add(newValue);
      indexed[row] = newValue;
    }
  }

  if (isMap(parent)) {
    const row = +path[path.length - 2];
    const indexed = getIndexedKeys(parent, context);
    if (!Number.isInteger(row) || row < 0 || row >= indexed.length) {
      throw new Error('index out of bounds');
    }

    const type = +lastKey === 0 ? 'key' : 'value';
    const keyToRow = indexed[row];
    const isVirtualRow = row >= parent.size;

    switch (type) {
      case 'key': {
        const newKey = mapper(keyToRow);
        rememberIndexedCollectionKeys(keyToRow, newKey, context);
        parent.set(newKey, parent.get(keyToRow));

        if (!isVirtualRow && newKey !== keyToRow) {
          parent.delete(keyToRow);
        }

        indexed[row] = newKey;
        break;
      }

      case 'value': {
        const oldValue = parent.get(keyToRow);
        const newValue = mapper(oldValue);
        rememberIndexedCollectionKeys(oldValue, newValue, context);
        parent.set(keyToRow, newValue);
        break;
      }
    }
  }

  return object;
};
