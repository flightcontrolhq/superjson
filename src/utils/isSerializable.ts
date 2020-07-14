import is from '@sindresorhus/is';

export const isSerializable = (
  value: any
): value is undefined | bigint | Date =>
  is.undefined(value) || is.bigint(value) || is.date(value);
