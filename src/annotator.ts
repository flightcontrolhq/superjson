import { mapDeep } from './mapDeep';
import {
  StringifiedPath,
  isStringifiedPath,
  parsePath,
  stringifyPath,
} from './pathstringifier';
import { Walker } from './plainer';
import {
  TypeAnnotation,
  isTypeAnnotation,
  transformValue,
  untransformValue,
} from './transformer';

export interface Annotations {
  root?: TypeAnnotation;
  values?: Record<StringifiedPath, TypeAnnotation>;
}

export const isAnnotations = (object: any): object is Annotations => {
  if (!!object.root && !isTypeAnnotation(object.root)) {
    return false;
  }

  if (!!object.values) {
    return Object.entries(object.values).every(
      ([key, value]) => isStringifiedPath(key) && isTypeAnnotation(value)
    );
  }

  return true;
};

export const makeAnnotator = () => {
  const annotations: Annotations = {};

  const annotator: Walker = ({ path, node }) => {
    const transformed = transformValue(node);

    if (transformed) {
      if (path.length === 0) {
        annotations.root = transformed.type;
      } else {
        if (!annotations.values) {
          annotations.values = {};
        }

        annotations.values[stringifyPath(path)] = transformed.type;
      }

      return transformed.value;
    } else {
      return node;
    }
  };

  return { annotations, annotator };
};

export const applyAnnotations = (plain: any, annotations: Annotations): any => {
  if (annotations.values) {
    const annotationsWithPaths = Object.entries(annotations.values).map(
      ([key, type]) => [parsePath(key), type] as [string[], TypeAnnotation]
    );

    const annotationsWithPathsLeavesToRoot = annotationsWithPaths.sort(
      ([pathA], [pathB]) => pathB.length - pathA.length
    );

    for (const [path, type] of annotationsWithPathsLeavesToRoot) {
      plain = mapDeep(plain, path, v =>
        untransformValue(v, type as TypeAnnotation)
      );
    }
  }

  if (annotations.root) {
    plain = untransformValue(plain, annotations.root);
  }

  return plain;
};
