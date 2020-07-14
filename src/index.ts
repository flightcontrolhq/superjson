import is from '@sindresorhus/is';

import { JSONValue, SuperJSONValue } from './types';
import { flatten, unflatten } from './utils/flattenizer';
import { isJSONPrimitive } from './utils/isJSONPrimitive';
import { isSerializable } from './utils/isSerializable';
import { transformValue } from './utils/transformValue';

export const serialize = (input: SuperJSONValue) => {
  let json: JSONValue;
  let meta: JSONValue;

  if (isJSONPrimitive(input)) {
    json = input;
    meta = null;

    return { json, meta };
  }

  if (isSerializable(input)) {
    json = transformValue(input).value;
    meta = transformValue(input).type;

    return { json, meta };
  }

  if (is.array(input) || is.plainObject(input)) {
    const flattened = flatten(input) as { [key: string]: any };
    json = {};
    meta = {};

    for (let i = 0, len = Object.keys(flattened).length; i < len; i++) {
      const key = Object.keys(flattened)[i];
      const value = Object.values(flattened)[i];

      if (isJSONPrimitive(value)) {
        json[key] = value;
      } else {
        json[key] = transformValue(value).value;
        meta[key] = transformValue(value).type;
      }
    }

    json = is.array(input)
      ? Array.from(Object.values(unflatten(json) as { [key: string]: any }))
      : (unflatten(json) as { [key: string]: any });
    meta = is.nonEmptyObject(meta) ? meta : null;

    return { json, meta };
  }

  throw new Error('invalid input');
};

export const deserialize = ({
  json,
  meta,
}: {
  json: JSONValue;
  meta: JSONValue;
}) => {
  if (is.null_(meta)) {
    return json;
  }

  if (is.array(json) || is.plainObject(json)) {
    const flattened = flatten(json) as { [key: string]: any };

    // const output = Object.keys(json).map(key => {
    //   const;
    // });

    console.log(flattened);
  }

  throw new Error('invalid input');
};
