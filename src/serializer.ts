import is from '@sindresorhus/is';

import { untransformValue } from './transformer';
import { makeAnnotator } from './annotator';
import { plainer } from './plainer';

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

export interface FlattenAnnotations {
  root?: TypeAnnotation;
  values?: Record<string, TypeAnnotation>;
}

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
  if (annotations.values) {
    const annotationsWithPaths = Object.entries(annotations.values).map(
      ([key, type]) => [keyToPath(key), type] as [string[], TypeAnnotation]
    );
    const annotationsWithPathsLeavesToRoot = annotationsWithPaths.sort(
      ([pathA], [pathB]) => pathB.length - pathA.length
    );

    for (const [path, type] of annotationsWithPathsLeavesToRoot) {
      unflattened = mapDeep(unflattened, path, v =>
        untransformValue(v, type as TypeAnnotation)
      );
    }
  }

  if (annotations.root) {
    unflattened = untransformValue(unflattened, annotations.root);
  }

  return unflattened;
};
