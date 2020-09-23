import {
  isBigint,
  isDate,
  isInfinite,
  isMap,
  isNaNValue,
  isRegExp,
  isSet,
  isUndefined,
  isSymbol,
  isArray,
} from './is';
import { ClassRegistry } from './class-registry';
import { SymbolRegistry } from './symbol-registry';
import * as IteratorUtils from './iteratorutils';
import { fromPairs } from 'lodash';

export type PrimitiveTypeAnnotation = 'number' | 'undefined' | 'bigint';

type LeafTypeAnnotation = PrimitiveTypeAnnotation | 'regexp' | 'Date';

type ClassTypeAnnotation = ['class', string];
type SymbolTypeAnnotation = ['symbol', string];

type SimpleTypeAnnotation = LeafTypeAnnotation | 'map' | 'set';

type CompositeTypeAnnotation = ClassTypeAnnotation | SymbolTypeAnnotation;

export type TypeAnnotation = SimpleTypeAnnotation | CompositeTypeAnnotation;

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
    return typeof value[1] === 'string';
  }

  return ALL_TYPE_ANNOTATIONS.includes(value);
};

function simpleTransformation<I, O, A extends SimpleTypeAnnotation>(
  isApplicable: (v: any) => v is I,
  annotation: A,
  transform: (v: I) => O,
  untransform: (v: O) => I
) {
  return {
    isApplicable,
    annotation,
    transform,
    untransform,
  };
}

const simpleRules = [
  simpleTransformation(
    isUndefined,
    'undefined',
    () => undefined,
    () => undefined
  ),
  simpleTransformation(isBigint, 'bigint', v => v.toString(), BigInt),
  simpleTransformation(
    isDate,
    'Date',
    v => v.toISOString(),
    v => new Date(v)
  ),

  simpleTransformation(
    isRegExp,
    'regexp',
    v => '' + v,
    regex => {
      const body = regex.slice(1, regex.lastIndexOf('/'));
      const flags = regex.slice(regex.lastIndexOf('/') + 1);
      return new RegExp(body, flags);
    }
  ),

  simpleTransformation(
    isSet,
    'set',
    v => IteratorUtils.map(v.values(), v => v),
    v => new Set(v)
  ),
  simpleTransformation(
    isMap,
    'map',
    v => IteratorUtils.map(v.entries(), v => v),
    v => new Map(v)
  ),

  simpleTransformation<number, 'NaN' | 'Infinity' | '-Infinity', 'number'>(
    (v): v is number => isNaNValue(v) || isInfinite(v),
    'number',
    v => {
      if (isNaNValue(v)) {
        return 'NaN';
      }

      if (v > 0) {
        return 'Infinity';
      } else {
        return '-Infinity';
      }
    },
    Number
  ),
];

function compositeTransformation<I, O, A extends CompositeTypeAnnotation>(
  isApplicable: (v: any) => v is I,
  annotation: (v: I) => A,
  transform: (v: I) => O,
  untransform: (v: O, a: A) => I
) {
  return {
    isApplicable,
    annotation,
    transform,
    untransform,
  };
}

const symbolRule = compositeTransformation(
  (s): s is Symbol => {
    if (isSymbol(s)) {
      const isRegistered = !!SymbolRegistry.getIdentifier(s);
      return isRegistered;
    }
    return false;
  },
  s => {
    const identifier = SymbolRegistry.getIdentifier(s);
    return ['symbol', identifier!];
  },
  v => v.description,
  (_, a) => {
    const value = SymbolRegistry.getValue(a[1]);
    if (!value) {
      throw new Error('Trying to deserialize unknown symbol');
    }
    return value;
  }
);

const classRule = compositeTransformation(
  (potentialClass): potentialClass is any => {
    if (potentialClass?.constructor) {
      const isRegistered = !!ClassRegistry.getIdentifier(
        potentialClass.constructor
      );
      return isRegistered;
    }
    return false;
  },
  clazz => {
    const identifier = ClassRegistry.getIdentifier(clazz.constructor);
    return ['class', identifier!];
  },
  v => v,
  (v, a) => {
    const clazz = ClassRegistry.getValue(a[1]);

    if (!clazz) {
      throw new Error('Trying to deserialize unknown class');
    }

    return Object.assign(Object.create(clazz.prototype), v);
  }
);

const compositeRules = [classRule, symbolRule];

export const transformValue = (
  value: any
): { value: any; type: TypeAnnotation } | undefined => {
  for (const rule of simpleRules) {
    if (rule.isApplicable(value)) {
      return {
        value: rule.transform(value as never),
        type: rule.annotation,
      };
    }
  }

  for (const rule of compositeRules) {
    if (rule.isApplicable(value)) {
      return {
        value: rule.transform(value),
        type: rule.annotation(value),
      };
    }
  }

  return undefined;
};

const simpleRulesByAnnotation = fromPairs(
  simpleRules.map(r => [r.annotation, r])
);

export const untransformValue = (json: any, type: TypeAnnotation) => {
  if (isArray(type)) {
    switch (type[0]) {
      case 'symbol':
        return symbolRule.untransform(json, type);
      case 'class':
        return classRule.untransform(json, type);
      default:
        throw new Error('Unknown transformation: ' + type);
    }
  } else {
    const transformation = simpleRulesByAnnotation[type];
    if (!transformation) {
      throw new Error('Unknown transformation: ' + type);
    }

    return transformation.untransform(json as never);
  }
};
