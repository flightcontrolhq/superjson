import is from '@sindresorhus/is';

import { applyAnnotations, makeAnnotator } from './annotator';
import { plainer } from './plainer';
import { SuperJSONResult, SuperJSONValue, isSuperJSONResult } from './types';

export const serialize = (object: SuperJSONValue): SuperJSONResult => {
  const { getAnnotations, annotator } = makeAnnotator();
  const output = plainer(object, annotator);

  const annotations = getAnnotations();

  return {
    json: output,
    meta: is.emptyObject(annotations) ? undefined : annotations,
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
