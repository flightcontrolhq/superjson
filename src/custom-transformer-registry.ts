import { SuperJSONValue, JSONValue } from './types.js';
import { find } from './util.js';

export interface NonRecursiveCustomTransfomer<I, O extends JSONValue> {
  name: string;
  isApplicable: (v: any) => v is I;
  serialize: (v: I) => O;
  deserialize: (v: O) => I;
  recursive?: false;
}

export interface RecursiveCustomTransfomer<I, O extends SuperJSONValue> {
  name: string;
  isApplicable: (v: any) => v is I;
  serialize: (v: I) => O;
  deserialize: (v: O) => I;
  recursive: true;
}

export type AnyCustomTransformer =
  | NonRecursiveCustomTransfomer<any, JSONValue>
  | RecursiveCustomTransfomer<any, SuperJSONValue>;

export class CustomTransformerRegistry {
  private transformers: Record<string, AnyCustomTransformer> = {};

  register<I, O extends JSONValue>(
    transformer: NonRecursiveCustomTransfomer<I, O>
  ): void;
  register<I, O extends SuperJSONValue>(
    transformer: RecursiveCustomTransfomer<I, O>
  ): void;
  register(transformer: AnyCustomTransformer) {
    this.transformers[transformer.name] = transformer;
  }

  findApplicable<T>(v: T) {
    return find(this.transformers, transformer =>
      transformer.isApplicable(v)
    ) as AnyCustomTransformer | undefined;
  }

  findByName(name: string) {
    return this.transformers[name];
  }
}
