import { applyAnnotations, makeAnnotator } from './annotator';
import { isEmptyObject } from './is';
import { plainer } from './plainer';
import { SuperJSONResult, SuperJSONValue, isSuperJSONResult } from './types';
import { clear, registerClass, unregisterClass } from './class-registry';

const serialize = (object: SuperJSONValue): SuperJSONResult => {
  const { getAnnotations, annotator } = makeAnnotator();
  const output = plainer(object, annotator);

  const annotations = getAnnotations();

  return {
    json: output,
    meta: isEmptyObject(annotations) ? undefined : annotations,
  };
};

const deserialize = (payload: SuperJSONResult): SuperJSONValue => {
  if (!isSuperJSONResult(payload)) {
    throw new Error('Not a valid SuperJSON payload.');
  }

  const { json, meta } = payload as SuperJSONResult;

  if (!!meta) {
    return applyAnnotations(json, meta);
  }

  return json;
};

const stringify = (object: SuperJSONValue): string =>
  JSON.stringify(serialize(object));

const parse = (string: string): SuperJSONValue =>
  deserialize(JSON.parse(string));

export default {
  stringify,
  parse,
  serialize,
  deserialize,
  clear,
  registerClass,
  unregisterClass,
};
