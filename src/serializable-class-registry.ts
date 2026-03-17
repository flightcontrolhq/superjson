import { Registry } from './registry.js';
import { Class } from './types.js';

export type SerializationMethodNames = {
  serialize: string;
  deserialize: string;
};

export interface RegisterSerializableOptions {
  identifier?: string;
  methodNames?: SerializationMethodNames;
}

export const DEFAULT_SERIALIZE_METHOD_NAMES: SerializationMethodNames = {
  serialize: 'toSuperJSON',
  deserialize: 'fromSuperJSON',
};

export class SerializableClassRegistry extends Registry<Class> {
  private classToMethods: Map<Class, SerializationMethodNames> = new Map();

  constructor() {
    super(c => c.name);
  }

  register(value: Class, options?: RegisterSerializableOptions | string): void {
    if (typeof options === 'object') {
      if (options.methodNames) {
        this.classToMethods.set(value, options.methodNames);
      }

      super.register(value, options.identifier);
    } else {
      super.register(value, options);
    }
  }

  getMethodNames(value: Class): SerializationMethodNames | undefined {
    return this.classToMethods.get(value);
  }
}
