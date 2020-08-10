import {
  isBigint,
  isDate,
  isInfinite,
  isMap,
  isNaNValue,
  isRegExp,
  isSet,
  isUndefined,
} from './is';
import * as ClassRegistry from './class-registry';
import * as IteratorUtils from './iteratorutils';

export type PrimitiveTypeAnnotation = 'number' | 'undefined' | 'bigint';

type LeafTypeAnnotation = PrimitiveTypeAnnotation | 'regexp' | 'Date';

type ClassTypeAnnotation = ['class', string];

type ContainerTypeAnnotation = 'map' | 'set' | ClassTypeAnnotation;

export type TypeAnnotation = LeafTypeAnnotation | ContainerTypeAnnotation;

const ALL_PRIMITIVE_TYPE_ANNOTATIONS: TypeAnnotation[] = [
  'undefined',
  'number',
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
  if (Array.isArray(value)) {
    switch (value[0]) {
      case 'map':
        return ['number', 'string', 'bigint', 'boolean'].includes(value[1]);
      case 'class':
        return typeof value[1] === 'string';
    }
  }

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
      value: 'NaN',
      type: 'number',
    };
  } else if (isInfinite(value)) {
    return {
      value: value > 0 ? 'Infinity' : '-Infinity',
      type: 'number',
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
    const entries = IteratorUtils.map(value.entries(), pair => pair);
    return {
      value: entries,
      type: 'map',
    };
  }

  if (value?.constructor) {
    const identifier = ClassRegistry.getIdentifier(value.constructor);
    if (identifier) {
      return {
        value: value,
        type: ['class', identifier],
      };
    }
  }

  return undefined;
};

export const untransformValue = (json: any, type: TypeAnnotation) => {
  if (Array.isArray(type)) {
    switch (type[0]) {
      case 'class': {
        const clazz = ClassRegistry.getClass(type[1]);

        if (!clazz) {
          throw new Error('Trying to deserialize unknown class');
        }

        return Object.assign(Object.create(clazz.prototype), json);
      }
    }
  }

  switch (type) {
    case 'bigint':
      return BigInt(json);
    case 'undefined':
      return undefined;
    case 'Date':
      return new Date(json as string);
    case 'number':
      return Number(json);
    case 'map':
      return new Map(json);
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
