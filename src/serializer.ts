import is from '@sindresorhus/is';

import { untransformValue } from './transformer';
import { makeAnnotator } from './annotator';
import { plainer } from './plainer';

const isNonEmptyFlat = (object: any): boolean => is.plainObject(object);

export const entries = (object: any): [any, any][] => {
  if (is.array(object)) {
    return object.map((v, i) => [i, v]);
  }

  if (is.set(object)) {
    return [...object].map((v, i) => [i, v]);
  }

  if (is.map(object)) {
    return [...object.entries()];
  }

  if (is.plainObject(object)) {
    return Object.entries(object);
  }

  throw new Error('Illegal Argument: ' + typeof object);
};

type LeafTypeAnnotation =
  | 'regexp'
  | 'NaN'
  | '-Infinity'
  | 'Infinity'
  | 'undefined'
  | 'bigint'
  | 'Date';

type ContainerTypeAnnotation = 'object' | 'map' | 'set';

export type TypeAnnotation = LeafTypeAnnotation | ContainerTypeAnnotation;

export type Flattened = Record<string, any> | null | undefined;

export type FlattenAnnotations = Record<string, TypeAnnotation>;

export const flattenAndSerialize = (
  unflattened: any
): { output: Flattened; annotations: FlattenAnnotations } => {
  const { annotations, annotator } = makeAnnotator();

  const output = plainer(unflattened, annotator);

  return { output, annotations };
};

const mapKey = (
  object: object,
  key: string | number,
  mapper: (v: any) => any
) => {
  if (is.array(object)) {
    return object.map((v, i) => {
      if (i === key) {
        return mapper(v);
      }

      return v;
    });
  } else {
    return {
      ...object,
      [key]: mapper((object as any)[key]),
    };
  }
};

const mapDeep = (
  object: object,
  path: string[],
  mapper: (v: any) => any
): object => {
  if (path.length < 1) {
    throw new Error('Illegal Argument');
  }

  const [head, ...tail] = path;

  if (path.length === 1) {
    return mapKey(object, head, mapper);
  }

  return mapKey(object, head, v => mapDeep(v ?? {}, tail, mapper));
};

const unescapeKey = (k: string) => k.replace(/\\\./g, '.');

export const keyToPath = (key: string) =>
  key.split(/(?<!\\)\./g).map(unescapeKey);

export const deserializeFlattened = (
  unflattened: any,
  annotations: FlattenAnnotations
): any => {
  if (!isNonEmptyFlat(unflattened)) {
    if (annotations['']) {
      return untransformValue(unflattened, annotations['']);
    }
    return unflattened;
  }

  for (const [key, type] of Object.entries(annotations)) {
    unflattened = mapDeep(unflattened, keyToPath(key), v =>
      untransformValue(v, type)
    );
  }

  return unflattened;
};
