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

export interface Annotations {
  root?: TypeAnnotation;
  values?: Record<string, TypeAnnotation>;
}

export const serialize = (
  unflattened: any
): { output: Flattened; annotations: Annotations } => {
  const { annotations, annotator } = makeAnnotator();

  const output = plainer(unflattened, annotator);

  return { output, annotations };
};
