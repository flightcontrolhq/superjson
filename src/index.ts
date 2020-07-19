import is from '@sindresorhus/is';

import { JSONValue, SuperJSONValue, JSONType, SuperJSONResult } from './types';
import { flattenAndSerialise, deserialiseFlattened } from './utils/flattenizer';
import { isJSONPrimitive } from './utils/isJSONPrimitive';
import { isSerializable } from './utils/isSerializable';
import { transformValue, untransformValue } from './utils/transformer';

export const serialize = (input: SuperJSONValue): SuperJSONResult => {
  if (isJSONPrimitive(input)) {
    return { json: input, meta: null };
  }

  if (isSerializable(input)) {
    const { value, type } = transformValue(input);

    return { json: value, meta: type };
  }

  if (is.array(input) || is.plainObject(input)) {
    const flattened = flattenAndSerialise(input) as { [key: string]: any };
    let json: JSONValue = {};
    let meta: Record<string, JSONType> = {};

    for (const [key, value] of Object.entries(flattened)) {
      if (isJSONPrimitive(value)) {
        json[key] = value;
      } else {
        const { value: transformedValue, type } = transformValue(value);
        json[key] = transformedValue;
        meta[key] = type;
      }
    }

    json = deserialiseFlattened(json) as { [key: string]: any };
    if (is.array(input)) {
      json = Array.from(Object.values(json));
    }

    const metaOrNullIfEmpty = is.nonEmptyObject(meta) ? meta : null;

    return { json, meta: metaOrNullIfEmpty };
  }

  throw new Error('invalid input');
};

export const deserialize = ({
  json,
  meta,
}: SuperJSONResult): SuperJSONValue => {
  if (is.null_(meta)) {
    return json;
  }

  if (is.string(meta)) {
    return untransformValue(json, meta);
  }

  if (is.array(json) || is.plainObject(json)) {
    const flattened = flattenAndSerialise(json) as { [key: string]: any };

    for (const [key, metaForKey] of Object.entries(meta)) {
      flattened[key] = untransformValue(flattened[key], metaForKey);
    }

    return deserialiseFlattened(flattened);
  }

  throw new Error('invalid input');
};
