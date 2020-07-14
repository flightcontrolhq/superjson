import is from '@sindresorhus/is';

export const isSerializable = (
  value: any
): value is undefined | bigint | Date | number =>
  is.undefined(value) ||
  is.bigint(value) ||
  is.date(value) ||
  is.nan(value) ||
  is.infinite(value);
