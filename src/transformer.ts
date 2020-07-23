import is from '@sindresorhus/is';

export type PrimitiveTypeAnnotation =
  | 'NaN'
  | '-Infinity'
  | 'Infinity'
  | 'undefined'
  | 'bigint';

type LeafTypeAnnotation = PrimitiveTypeAnnotation | 'regexp' | 'Date';

type MapTypeAnnotation = 'map:number' | 'map:string' | "map:bigint" | "map:boolean";

type ContainerTypeAnnotation = MapTypeAnnotation | 'set';

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
  ['map:number', 'map:string', 'map:bigint', 'map:boolean', 'regexp', 'set', 'Date']
);

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
    const { done: valueIsEmpty, value: firstKey } = value.keys().next()
    const returnValueDoesntMatter = valueIsEmpty;
    if (returnValueDoesntMatter || is.string(firstKey)) {
      return { value, type: "map:string" }
    }

    if (is.number(firstKey)) {
      return {
        value: value,
        type: 'map:number',
      };  
    }

    if (is.bigint(firstKey)) {
      return {
        value: value,
        type: 'map:bigint',
      };  
    }

    if (is.boolean(firstKey)) {
      return {
        value: value,
        type: 'map:boolean',
      };  
    }

    throw new Error("Key type not supported.")
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
    case 'map:number':
      return new Map(Object.entries(json).map(([k, v]) => [Number(k), v]));
    case 'map:string':
      return new Map(Object.entries(json));
    case "map:boolean":
      return new Map(Object.entries(json).map(([k, v]) => [Boolean(k), v]));
    case "map:bigint":
      return new Map(Object.entries(json).map(([k, v]) => [BigInt(k), v]));
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

