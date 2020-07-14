import is from '@sindresorhus/is';

export const transformValue = (value: undefined | bigint | Date) => {
  if (is.undefined(value)) {
    return {
      value: 'undefined',
      type: 'undefined',
    };
  } else if (is.bigint(value)) {
    return {
      value: Number(value),
      type: 'bigint',
    };
  } else if (is.date(value)) {
    return {
      value: value.toISOString(),
      type: 'Date',
    };
  }

  throw new Error('invalid input');
};
