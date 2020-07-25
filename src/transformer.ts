import {
  isBigint,
  isBoolean,
  isDate,
  isInfinite,
  isMap,
  isNaNValue,
  isNumber,
  isRegExp,
  isSet,
  isUndefined,
} from './is';

export type PrimitiveTypeAnnotation =
  | 'NaN'
  | '-Infinity'
  | 'Infinity'
  | 'undefined'
  | 'bigint';

type LeafTypeAnnotation = PrimitiveTypeAnnotation | 'regexp' | 'Date';

type ContainerTypeAnnotation = 'map' | 'set';

export type TypeAnnotation = LeafTypeAnnotation | ContainerTypeAnnotation;

const ALL_PRIMITIVE_TYPE_ANNOTATIONS: TypeAnnotation[] = [
  '-Infinity',
  'Infinity',
  'undefined',
  'NaN',
  'bigint',
];

export const isPrimitiveTypeAnnotation = (
  value: any
): value is PrimitiveTypeAnnotation => {
  return ALL_PRIMITIVE_TYPE_ANNOTATIONS.includes(value);
};

const ALL_TYPE_ANNOTATIONS: TypeAnnotation[] = ALL_PRIMITIVE_TYPE_ANNOTATIONS.concat(
  ['map', 'regexp', 'set', 'Date']
);

export const isTypeAnnotation = (value: any): value is TypeAnnotation => {
  return ALL_TYPE_ANNOTATIONS.includes(value);
};

export const transformValue = (
  value: any
): { value: any; type: TypeAnnotation } | undefined => {
  if (isUndefined(value)) {
    return {
      value: undefined,
      type: 'undefined',
    };
  } else if (isBigint(value)) {
    return {
      value: value.toString(),
      type: 'bigint',
    };
  } else if (isDate(value)) {
    return {
      value: value.toISOString(),
      type: 'Date',
    };
  } else if (isNaNValue(value)) {
    return {
      value: undefined,
      type: 'NaN',
    };
  } else if (isInfinite(value)) {
    return {
      value: undefined,
      type: value > 0 ? 'Infinity' : '-Infinity',
    };
  } else if (isSet(value)) {
    return {
      value: Array.from(value) as any[],
      type: 'set',
    };
  } else if (isRegExp(value)) {
    return {
      value: '' + value,
      type: 'regexp',
    };
  } else if (isMap(value)) {
    return {
      value: value,
      type: 'map',
    };
  }

  return undefined;
};

export const untransformValue = (json: any, type: TypeAnnotation) => {
  switch (type) {
    case 'bigint':
      return BigInt(json);
    case 'undefined':
      return undefined;
    case 'Date':
      return new Date(json as string);
    case 'NaN':
      return Number.NaN;
    case 'Infinity':
      return Number.POSITIVE_INFINITY;
    case '-Infinity':
      return Number.NEGATIVE_INFINITY;
    case 'map':
      return new Map(Object.entries(json));
    case 'set':
      return new Set(json as unknown[]);
    case 'regexp': {
      const regex = json as string;
      const body = regex.slice(1, regex.lastIndexOf('/'));
      const flags = regex.slice(regex.lastIndexOf('/') + 1);
      return new RegExp(body, flags);
    }
    default:
      return json;
  }
};

export type KeyTypeAnnotation = PrimitiveTypeAnnotation | 'number' | 'boolean';

export function isKeyTypeAnnotation(
  string: unknown
): string is KeyTypeAnnotation {
  return (
    string === 'number' ||
    string === 'boolean' ||
    isPrimitiveTypeAnnotation(string)
  );
}

export function transformKey(
  key: any
): { key: string; type: KeyTypeAnnotation } | undefined {
  if (isNumber(key)) {
    return { key: '' + key, type: 'number' };
  }

  if (isBoolean(key)) {
    return { key: '' + key, type: 'boolean' };
  }

  const transformed = transformValue(key)!;
  if (transformed) {
    return {
      key: '' + transformed.value,
      type: transformed.type as KeyTypeAnnotation,
    };
  }

  return undefined;
}

export function untransformKey(key: any, type: KeyTypeAnnotation): any {
  switch (type) {
    case 'number':
      return Number(key);
    case 'boolean':
      return Boolean(key);
    default:
      return untransformValue(key, type);
  }
}
