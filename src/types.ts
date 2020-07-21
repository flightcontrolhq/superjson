import { Annotations, isAnnotations } from './annotator';
import is from '@sindresorhus/is';

export type PrimitveJSONValue = string | number | boolean | undefined | null;

export type JSONValue = PrimitveJSONValue | JSONArray | JSONObject;

export interface JSONArray extends Array<JSONValue> {}

export interface JSONObject {
  [key: string]: JSONValue;
}

export type SerializableJSONValue =
  | Set<any>
  | Map<PrimitveJSONValue, SuperJSONValue>
  | undefined
  | bigint
  | Date
  | RegExp;

export type SuperJSONValue =
  | JSONValue
  | SerializableJSONValue
  | SuperJSONArray
  | SuperJSONObject;

export interface SuperJSONArray extends Array<SuperJSONValue> {}

export interface SuperJSONObject {
  [key: string]: SuperJSONValue;
}

export interface SuperJSONResult {
  json: JSONValue;
  meta?: Annotations;
}

export function isSuperJSONResult(object: any): object is SuperJSONResult {
  if (is.undefined(object.json)) {
    return false;
  }

  if (is.undefined(object.meta)) {
    return true;
  }

  return isAnnotations(object.meta);
}
