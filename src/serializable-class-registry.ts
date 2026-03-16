import { Registry } from './registry.js';
import { SuperJSONValue } from './types.js';

export interface SerializableClass {
  fromSuperJSON(json: SuperJSONValue): InstanceType<this>;
  new (...args: any[]): { toSuperJSON(): SuperJSONValue };
}

export class SerializableClassRegistry extends Registry<SerializableClass> {
  constructor() {
    super(c => c.name);
  }
  register(value: SerializableClass, identifier?: string): void {
    const id = identifier ?? value.name;
    if (
      typeof value?.fromSuperJSON !== 'function' ||
      typeof value?.prototype.toSuperJSON !== 'function'
    ) {
      throw new Error(
        `Class '${id}' must define static 'fromJSON()' and instance 'toJSON()' methods`
      );
    }
    super.register(value, id);
  }
}
