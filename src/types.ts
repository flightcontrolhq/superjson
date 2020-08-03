import { Annotations, isAnnotations } from './annotator';
import { isUndefined } from './is';

export type Class = { new (...args: any[]): any };

export type PrimitveJSONValue = string | number | boolean | undefined | null;

export type JSONValue = PrimitveJSONValue | JSONArray | JSONObject;

export interface JSONArray extends Array<JSONValue> {}

export interface JSONObject {
  [key: string]: JSONValue;
}

type MapWithUniformKeys =
  | Map<string, SuperJSONValue>
  | Map<number, SuperJSONValue>
  | Map<undefined, SuperJSONValue>
  | Map<null, SuperJSONValue>
  | Map<boolean, SuperJSONValue>;

export type SerializableJSONValue =
  | Set<any>
  | MapWithUniformKeys
  | Symbol
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
  if (isUndefined(object.json)) {
    return false;
  }

  if (isUndefined(object.meta)) {
    return true;
  }

  return isAnnotations(object.meta);
}
