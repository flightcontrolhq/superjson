import is from '@sindresorhus/is';
import { JSONType, JSONValue, SerializableJSONValue } from '../types';

export const transformValue = (
  value: SerializableJSONValue
): { value: JSONValue; type: JSONType } => {
  if (is.undefined(value)) {
    return {
      value: undefined,
      type: 'undefined',
    };
  } else if (is.bigint(value)) {
    return {
      value: value.toString(),
      type: 'bigint',
    };
  } else if (is.date(value)) {
    return {
      value: value.toISOString(),
      type: 'Date',
    };
  } else if (is.nan(value)) {
    return {
      value: undefined,
      type: 'NaN',
    };
  } else if (is.infinite(value)) {
    return {
      value: undefined,
      type: value > 0 ? 'Infinity' : '-Infinity',
    };
  } else if (is.set(value)) {
    return {
      value: Array.from(value) as any[],
      type: 'set',
    };
  } else if (is.regExp(value)) {
    return {
      value: '' + value,
      type: 'regexp',
    };
  }

  throw new Error('invalid input');
};

export const untransformValue = (json: JSONValue, type: JSONType) => {
  switch (type) {
    case 'bigint':
      return BigInt(json);
    case 'undefined':
      return undefined;
    case 'Date':
      return new Date(json as string);
    case 'NaN':
      return 0 / 0;
    case 'Infinity':
      return 1 / 0;
    case '-Infinity':
      return -1 / 0;
    case 'set':
      return new Set(json as unknown[]);
    case 'regexp': {
      const regex = json as string;
      const body = regex.slice(1, regex.lastIndexOf('/'));
      const flags = regex.slice(regex.lastIndexOf('/') + 1);
      return new RegExp(body, flags);
    }
    default:
      throw new Error('invalid input');
  }
};
