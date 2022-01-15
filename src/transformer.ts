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
  isError,
  isTypedArray,
  TypedArrayConstructor,
} from './is';
import { ClassRegistry } from './class-registry';
import { SymbolRegistry } from './symbol-registry';
import { CustomTransformerRegistry } from './custom-transformer-registry';
import { allowedErrorProps } from './error-props';
import { findArr } from './util';

export type PrimitiveTypeAnnotation = 'number' | 'undefined' | 'bigint';

type LeafTypeAnnotation = PrimitiveTypeAnnotation | 'regexp' | 'Date' | 'Error';

type TypedArrayAnnotation = ['typed-array', string];
type ClassTypeAnnotation = ['class', string];
type SymbolTypeAnnotation = ['symbol', string];
type CustomTypeAnnotation = ['custom', string];

type SimpleTypeAnnotation = LeafTypeAnnotation | 'map' | 'set';

type CompositeTypeAnnotation =
  | TypedArrayAnnotation
  | ClassTypeAnnotation
  | SymbolTypeAnnotation
  | CustomTypeAnnotation;

export type TypeAnnotation = SimpleTypeAnnotation | CompositeTypeAnnotation;

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
    () => null,
    () => undefined
  ),
  simpleTransformation(
    isBigint,
    'bigint',
    v => v.toString(),
    v => {
      if (typeof BigInt !== 'undefined') {
        return BigInt(v);
      }

      console.error('Please add a BigInt polyfill.');

      return v as any;
    }
  ),
  simpleTransformation(
    isDate,
    'Date',
    v => v.toISOString(),
    v => new Date(v)
  ),

  simpleTransformation(
    isError,
    'Error',
    v => {
      const baseError: any = {
        name: v.name,
        message: v.message,
      };

      allowedErrorProps.forEach(prop => {
        baseError[prop] = (v as any)[prop];
      });

      return baseError;
    },
    v => {
      const e = new Error(v.message);
      e.name = v.name;
      e.stack = v.stack;

      allowedErrorProps.forEach(prop => {
        (e as any)[prop] = v[prop];
      });

      return e;
    }
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
    // (sets only exist in es6+)
    // eslint-disable-next-line es5/no-es6-methods
    v => [...v.values()],
    v => new Set(v)
  ),
  simpleTransformation(
    isMap,
    'map',
    v => [...v.entries()],
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

  simpleTransformation<number, '-0', 'number'>(
    (v): v is number => v === 0 && 1 / v === -Infinity,
    'number',
    () => {
      return '-0';
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

const constructorToName = [
  Int8Array,
  Uint8Array,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array,
  Uint8ClampedArray,
].reduce<Record<string, TypedArrayConstructor>>((obj, ctor) => {
  obj[ctor.name] = ctor;
  return obj;
}, {});

const typedArrayRule = compositeTransformation(
  isTypedArray,
  v => ['typed-array', v.constructor.name],
  v => [...v],
  (v, a) => {
    const ctor = constructorToName[a[1]];

    if (!ctor) {
      throw new Error('Trying to deserialize unknown typed array');
    }

    return new ctor(v);
  }
);

export function isInstanceOfRegisteredClass(
  potentialClass: any
): potentialClass is any {
  if (potentialClass?.constructor) {
    const isRegistered = !!ClassRegistry.getIdentifier(
      potentialClass.constructor
    );
    return isRegistered;
  }
  return false;
}

const classRule = compositeTransformation(
  isInstanceOfRegisteredClass,
  clazz => {
    const identifier = ClassRegistry.getIdentifier(clazz.constructor);
    return ['class', identifier!];
  },
  clazz => {
    const allowedProps = ClassRegistry.getAllowedProps(clazz.constructor);
    if (!allowedProps) {
      return { ...clazz };
    }

    const result: any = {};
    allowedProps.forEach(prop => {
      result[prop] = clazz[prop];
    });
    return result;
  },
  (v, a) => {
    const clazz = ClassRegistry.getValue(a[1]);

    if (!clazz) {
      throw new Error(
        'Trying to deserialize unknown class - check https://github.com/blitz-js/superjson/issues/116#issuecomment-773996564'
      );
    }

    return Object.assign(Object.create(clazz.prototype), v);
  }
);

const customRule = compositeTransformation(
  (value): value is any => {
    return !!CustomTransformerRegistry.findApplicable(value);
  },
  value => {
    const transformer = CustomTransformerRegistry.findApplicable(value)!;
    return ['custom', transformer.name];
  },
  value => {
    const transformer = CustomTransformerRegistry.findApplicable(value)!;
    return transformer.serialize(value);
  },
  (v, a) => {
    const transformer = CustomTransformerRegistry.findByName(a[1]);
    if (!transformer) {
      throw new Error('Trying to deserialize unknown custom value');
    }
    return transformer.deserialize(v);
  }
);

const compositeRules = [classRule, symbolRule, customRule, typedArrayRule];

export const transformValue = (
  value: any
): { value: any; type: TypeAnnotation } | undefined => {
  const applicableCompositeRule = findArr(compositeRules, rule =>
    rule.isApplicable(value)
  );
  if (applicableCompositeRule) {
    return {
      value: applicableCompositeRule.transform(value as never),
      type: applicableCompositeRule.annotation(value),
    };
  }

  const applicableSimpleRule = findArr(simpleRules, rule =>
    rule.isApplicable(value)
  );

  if (applicableSimpleRule) {
    return {
      value: applicableSimpleRule.transform(value as never),
      type: applicableSimpleRule.annotation,
    };
  }

  return undefined;
};

const simpleRulesByAnnotation: Record<string, typeof simpleRules[0]> = {};
simpleRules.forEach(rule => {
  simpleRulesByAnnotation[rule.annotation] = rule;
});

export const untransformValue = (json: any, type: TypeAnnotation) => {
  if (isArray(type)) {
    switch (type[0]) {
      case 'symbol':
        return symbolRule.untransform(json, type);
      case 'class':
        return classRule.untransform(json, type);
      case 'custom':
        return customRule.untransform(json, type);
      case 'typed-array':
        return typedArrayRule.untransform(json, type);
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
