export type JSONValue =
  | string
  | number
  | boolean
  | JSONArray
  | JSONObject
  | null;

export interface JSONArray extends Array<JSONValue> {}

export interface JSONObject {
  [key: string]: JSONValue;
}

export type SerializableJSONValue =
  | Set<any>
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
  meta: null | JSONType | Record<string, JSONType>;
}

export type JSONType = 'undefined' | 'bigint' | 'Date' | 'set' | 'regexp';
