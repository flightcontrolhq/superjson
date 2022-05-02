import { SuperJSONResult, SuperJSONValue, Class, JSONValue } from './types';
import { ClassRegistry, RegisterOptions } from './class-registry';
import { SymbolRegistry } from './symbol-registry';
import {
  CustomTransfomer,
  CustomTransformerRegistry,
} from './custom-transformer-registry';
import { allowErrorProps } from './error-props';
import {
  walker,
  applyReferentialEqualityAnnotations,
  applyValueAnnotations,
  generateReferentialEqualityAnnotations,
} from './plainer';
import { copy } from 'copy-anything';

export const serialize = (object: SuperJSONValue): SuperJSONResult => {
  const identities = new Map<any, any[][]>();
  const output = walker(object, identities);
  const res: SuperJSONResult = {
    json: output.transformedValue,
  };

  if (output.annotations) {
    res.meta = {
      ...res.meta,
      values: output.annotations,
    };
  }

  const equalityAnnotations = generateReferentialEqualityAnnotations(
    identities
  );
  if (equalityAnnotations) {
    res.meta = {
      ...res.meta,
      referentialEqualities: equalityAnnotations,
    };
  }

  return res;
};

export const deserialize = <T = unknown>(payload: SuperJSONResult): T => {
  const { json, meta } = payload;

  let result: T = copy(json) as any;

  if (meta?.values) {
    result = applyValueAnnotations(result, meta.values);
  }

  if (meta?.referentialEqualities) {
    result = applyReferentialEqualityAnnotations(
      result,
      meta.referentialEqualities
    );
  }

  return result;
};

export const stringify = (object: SuperJSONValue): string =>
  JSON.stringify(serialize(object));

export const parse = <T = unknown>(string: string): T =>
  deserialize(JSON.parse(string));

export const registerClass = (v: Class, options?: RegisterOptions | string) =>
  ClassRegistry.register(v, options);

export const registerSymbol = (v: Symbol, identifier?: string) =>
  SymbolRegistry.register(v, identifier);

export const registerCustom = <I, O extends JSONValue>(
  transformer: Omit<CustomTransfomer<I, O>, 'name'>,
  name: string
) =>
  CustomTransformerRegistry.register({
    name,
    ...transformer,
  });

export default {
  stringify,
  parse,
  serialize,
  deserialize,
  registerClass,
  registerSymbol,
  registerCustom,
  allowErrorProps,
};
