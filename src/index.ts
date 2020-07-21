import is from '@sindresorhus/is';
import { makeAnnotator, applyAnnotations } from './annotator';
import { plainer } from './plainer';
import { SuperJSONResult, isSuperJSONResult, SuperJSONValue } from './types';

export const serialize = (object: SuperJSONValue): SuperJSONResult => {
  const { annotations, annotator } = makeAnnotator();
  const output = plainer(object, annotator);

  return {
    json: output,
    meta: is.emptyObject(annotations) ? undefined : annotations,
  };
};

export const deserialize = (payload: SuperJSONResult): SuperJSONValue => {
  if (!isSuperJSONResult(payload)) {
    throw new Error('Not a SuperJSON payload.');
  }

  const { json, meta } = payload as SuperJSONResult;

  if (!!meta) {
    return applyAnnotations(json, meta);
  }

  return json;
};

export const stringify = (object: any): string => {
  const payload = serialize(object);
  return JSON.stringify(payload);
};

export const parse = (string: string): any => {
  const payload: any = JSON.parse(string);
  return deserialize(payload);
};

export default { stringify, parse, serialize, deserialize };
