import is from '@sindresorhus/is';
import {
  makeAnnotator,
  applyAnnotations,
  isAnnotations,
  Annotations,
} from './annotator';
import { plainer } from './plainer';

interface SuperJSONStringPayload<T = any> {
  value: T;
  meta?: Annotations;
}

function isSuperJSONStringPayload(
  object: any
): object is SuperJSONStringPayload {
  if (is.undefined(object.value)) {
    return false;
  }

  if (is.undefined(object.meta)) {
    return true;
  }

  return isAnnotations(object.meta);
}

export const serialize = (object: any): SuperJSONStringPayload => {
  const { annotations, annotator } = makeAnnotator();
  const output = plainer(object, annotator);

  return {
    value: output,
    meta: is.emptyObject(annotations) ? undefined : annotations,
  };
};

export const deserialize = (payload: any): any => {
  if (!isSuperJSONStringPayload(payload)) {
    throw new Error('Not a SuperJSON payload.');
  }

  const { value, meta } = payload as SuperJSONStringPayload;

  if (!!meta) {
    return applyAnnotations(value, meta);
  }

  return value;
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
