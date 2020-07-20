import { Walker } from './plainer';
import { transformValue, untransformValue } from './transformer';
import { FlattenAnnotations, TypeAnnotation } from './serializer';
import { stringifyPath, parsePath } from './pathstringifier';
import { mapDeep } from './mapDeep';

export const makeAnnotator = () => {
  const annotations: FlattenAnnotations = {};

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

export const applyAnnotations = (
  plain: any,
  annotations: FlattenAnnotations
): any => {
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
