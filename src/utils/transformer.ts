import is from '@sindresorhus/is';
import { JSONType, JSONValue } from '../types';

export const transformValue = (
  value: undefined | bigint | Date | number
): { value: JSONValue; type: JSONType } => {
  if (is.undefined(value)) {
    return {
      value: 'undefined',
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
  } else if (is.nan(value) || is.infinite(value)) {
    return {
      value: value.toString(),
      type: 'number',
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
    case 'number':
      return Number(json);
    default:
      throw new Error('invalid input');
  }
};
