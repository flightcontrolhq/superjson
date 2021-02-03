import { applyAnnotations, makeAnnotator } from './annotator';
import { isEmptyObject } from './is';
import { plainer } from './plainer';
import {
  SuperJSONResult,
  SuperJSONValue,
  isSuperJSONResult,
  Class,
  JSONValue,
} from './types';
import { ClassRegistry, RegisterOptions } from './class-registry';
import { SymbolRegistry } from './symbol-registry';
import {
  CustomTransfomer,
  CustomTransformerRegistry,
} from './custom-transformer-registry';
import { allowErrorProps } from './error-props';

export const serialize = (object: SuperJSONValue): SuperJSONResult => {
  const { getAnnotations, annotator } = makeAnnotator();
  const output = plainer(object, annotator);

  const annotations = getAnnotations();
  const res: SuperJSONResult = {
    json: output,
  };
  if (!isEmptyObject(annotations)) {
    res.meta = annotations;
  }
  return res;
};

export const deserialize = <T = unknown>(payload: SuperJSONResult): T => {
  if (!isSuperJSONResult(payload)) {
    throw new Error('Not a valid SuperJSON payload.');
  }

  const { json, meta } = payload;

  const result: T = json as any;

  if (!!meta) {
    return applyAnnotations(result, meta);
  }

  return result;
};

const stringify = (object: SuperJSONValue): string =>
  JSON.stringify(serialize(object));

export const parse = <T = unknown>(string: string): T =>
  deserialize(JSON.parse(string));

const registerClass = (v: Class, options?: RegisterOptions | string) =>
  ClassRegistry.register(v, options);

const registerSymbol = (v: Symbol, identifier?: string) =>
  SymbolRegistry.register(v, identifier);

const registerCustom = <I, O extends JSONValue>(
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
