import { makeAnnotator } from './annotator';
import { plainer } from './plainer';

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
