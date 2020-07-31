class DoubleIndexedKV<K, V> {
  keyToValue = new Map<K, V>();
  valueToKey = new Map<V, K>();

  set(key: K, value: V) {
    this.keyToValue.set(key, value);
    this.valueToKey.set(value, key);
  }

  deleteByValue(value: V) {
    this.valueToKey.delete(value);
    this.keyToValue.forEach((otherValue, otherKey) => {
      if (value === otherValue) {
        this.keyToValue.delete(otherKey);
      }
    });
  }

  getByKey(key: K): V | undefined {
    return this.keyToValue.get(key);
  }

  getByValue(value: V): K | undefined {
    return this.valueToKey.get(value);
  }

  clear() {
    this.keyToValue.clear();
    this.valueToKey.clear();
  }
}

type Class = { new (): any };

const classRegistry = new DoubleIndexedKV<string, Class>();

export function registerClass(clazz: Class, identifier?: string): void {
  if (classRegistry.getByValue(clazz)) {
    return;
  }

  if (!identifier) {
    identifier = clazz.name;
  }

  if (classRegistry.getByKey(identifier)) {
    throw new Error('Ambiguous class, provide a unique identifier.');
  }

  classRegistry.set(identifier, clazz);
}

export function unregisterClass(clazz: Class): void {
  classRegistry.deleteByValue(clazz);
}

export function clear(): void {
  classRegistry.clear();
}

export function getIdentifier(clazz: Class) {
  return classRegistry.getByValue(clazz);
}

export function getClass(identifier: string) {
  return classRegistry.getByKey(identifier);
}
