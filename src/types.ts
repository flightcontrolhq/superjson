import { Annotations, isAnnotations } from './annotator';
import { isUndefined } from './is';

export type Class = { new (...args: any[]): any };

export type PrimitveJSONValue = string | number | boolean | undefined | null;

export type JSONValue = PrimitveJSONValue | JSONArray | JSONObject;

export interface JSONArray extends Array<JSONValue> {}

export interface JSONObject {
  [key: string]: JSONValue;
}

type ClassInstance = any;

export type SerializableJSONValue =
  | Symbol
  | Set<SuperJSONValue>
  | Map<SuperJSONValue, SuperJSONValue>
  | undefined
  | bigint
  | Date
  | ClassInstance
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
  if (!('json' in object)) {
    return false;
  }

  if (isUndefined(object.meta)) {
    return true;
  }

  return isAnnotations(object.meta);
}
