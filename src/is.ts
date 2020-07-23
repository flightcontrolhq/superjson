const getType = (payload: any): string =>
  Object.prototype.toString.call(payload).slice(8, -1);

export const isUndefined = (payload: any): payload is undefined =>
  getType(payload) === 'Undefined';

export const isNull = (payload: any): payload is null =>
  getType(payload) === 'Null';

export const isPlainObject = (
  payload: any
): payload is { [key: string]: any } => {
  if (getType(payload) !== 'Object') return false;
  return (
    payload.constructor === Object &&
    Object.getPrototypeOf(payload) === Object.prototype
  );
};

export const isEmptyObject = (payload: any): payload is {} =>
  isPlainObject(payload) && Object.keys(payload).length === 0;

export const isArray = (payload: any): payload is any[] =>
  getType(payload) === 'Array';

export const isString = (payload: any): payload is string =>
  getType(payload) === 'String';

export const isNumber = (payload: any): payload is number =>
  getType(payload) === 'Number' && !isNaN(payload);

export const isBoolean = (payload: any): payload is boolean =>
  getType(payload) === 'Boolean';

export const isRegExp = (payload: any): payload is RegExp =>
  getType(payload) === 'RegExp';

export const isMap = (payload: any): payload is Map<any, any> =>
  getType(payload) === 'Map';

export const isSet = (payload: any): payload is Set<any> =>
  getType(payload) === 'Set';

export const isSymbol = (payload: any): payload is symbol =>
  getType(payload) === 'Symbol';

export const isDate = (payload: any): payload is Date =>
  getType(payload) === 'Date' && !isNaN(payload);

export const isNaNValue = (payload: any): payload is typeof NaN =>
  getType(payload) === 'Number' && isNaN(payload);

export const isPrimitive = (
  payload: any
): payload is boolean | null | undefined | number | string | symbol =>
  isBoolean(payload) ||
  isNull(payload) ||
  isUndefined(payload) ||
  isNumber(payload) ||
  isString(payload) ||
  isSymbol(payload);

export const isBigint = (payload: any): payload is bigint =>
  getType(payload) === 'BigInt';

export const isInfinite = (payload: any): payload is number =>
  payload === Infinity || payload === -Infinity;
