import { SuperJSONValue } from './types.js';
import { find } from './util.js';

export interface CustomTransfomer<I, O extends SuperJSONValue> {
  name: string;
  isApplicable: (v: any) => v is I;
  serialize: (v: I) => O;
  deserialize: (v: O) => I;
  recursive?: boolean;
}

export class CustomTransformerRegistry {
  private transfomers: Record<string, CustomTransfomer<any, any>> = {};

  register<I, O extends SuperJSONValue>(transformer: CustomTransfomer<I, O>) {
    this.transfomers[transformer.name] = transformer;
  }

  findApplicable<T>(v: T) {
    return find(this.transfomers, transformer =>
      transformer.isApplicable(v)
    ) as CustomTransfomer<T, SuperJSONValue> | undefined;
  }

  findByName(name: string) {
    return this.transfomers[name];
  }
}
