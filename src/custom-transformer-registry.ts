import { JSONValue } from './types';
import { find } from './util';

export interface CustomTransfomer<I, O extends JSONValue> {
  name: string;
  isApplicable: (v: any) => v is I;
  serialize: (v: I) => O;
  deserialize: (v: O) => I;
}

const transfomers: Record<string, CustomTransfomer<any, any>> = {};

export const CustomTransformerRegistry = {
  register<I, O extends JSONValue>(transformer: CustomTransfomer<I, O>) {
    transfomers[transformer.name] = transformer;
  },

  findApplicable<T>(v: T) {
    return find(transfomers, transformer => transformer.isApplicable(v)) as
      | CustomTransfomer<T, JSONValue>
      | undefined;
  },

  findByName(name: string) {
    return transfomers[name];
  },
};
