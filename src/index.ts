import { applyAnnotations, makeAnnotator } from './annotator';
import { isEmptyObject } from './is';
import { plainer } from './plainer';
import { SuperJSONResult, SuperJSONValue, isSuperJSONResult } from './types';

export const serialize = (object: SuperJSONValue): SuperJSONResult => {
  const { annotations, annotator } = makeAnnotator();
  const output = plainer(object, annotator);

  return {
    json: output,
    meta: isEmptyObject(annotations) ? undefined : annotations,
  };
};

export const deserialize = (payload: SuperJSONResult): SuperJSONValue => {
  if (!isSuperJSONResult(payload)) {
    throw new Error('Not a valid SuperJSON payload.');
  }

  const { json, meta } = payload as SuperJSONResult;

  if (!!meta) {
    return applyAnnotations(json, meta);
  }

  return json;
};

export const stringify = (object: SuperJSONValue): string =>
  JSON.stringify(serialize(object));

export const parse = (string: string): SuperJSONValue =>
  deserialize(JSON.parse(string));

export default { stringify, parse, serialize, deserialize };
