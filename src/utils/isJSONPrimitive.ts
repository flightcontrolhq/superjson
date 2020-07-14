import is from '@sindresorhus/is';

export const isJSONPrimitive = (
  value: any
): value is string | number | boolean | null =>
  is.string(value) || is.number(value) || is.boolean(value) || is.null_(value);
