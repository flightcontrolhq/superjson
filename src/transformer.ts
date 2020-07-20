import is from '@sindresorhus/is';

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

export type KeyTypeAnnotation = PrimitiveTypeAnnotation | 'number';

export function isKeyTypeAnnotation(
  string: unknown
): string is KeyTypeAnnotation {
  return string === 'number' || isPrimitiveTypeAnnotation(string);
}

export const isTypeAnnotation = (value: any): value is TypeAnnotation => {
  return ALL_TYPE_ANNOTATIONS.includes(value);
};

export const transformValue = (
  value: any
): { value: any; type: TypeAnnotation } | undefined => {
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
  } else if (is.map(value)) {
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

export function transformKey(
  key: any
): { key: string; type: KeyTypeAnnotation } | undefined {
  if (is.number(key)) {
    return { key: '' + key, type: 'number' };
  }

  if (is.undefined(key)) {
    return { key: 'undefined', type: 'undefined' };
  }

  return undefined;
}

export function untransformKey(key: any, type: KeyTypeAnnotation): any {
  switch (type) {
    case 'number':
      return Number(key);
    case 'undefined':
      return undefined;
    default:
      throw new Error('Not implemented');
  }
}
