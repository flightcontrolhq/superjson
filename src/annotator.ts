import { Walker } from './plainer';
import {
  transformValue,
  untransformValue,
  TypeAnnotation,
  isTypeAnnotation,
  isKeyTypeAnnotation,
  KeyTypeAnnotation,
  transformKey,
  untransformKey,
} from './transformer';
import {
  stringifyPath,
  parsePath,
  StringifiedPath,
  isStringifiedPath,
} from './pathstringifier';
import { mapDeep } from './mapDeep';
import is from '@sindresorhus/is/dist';

export interface Annotations {
  root?: TypeAnnotation;
  values?: Record<StringifiedPath, TypeAnnotation>;
  keys?: Record<StringifiedPath, KeyTypeAnnotation>;
}

export function isAnnotations(object: any): object is Annotations {
  if (!!object.root && !isTypeAnnotation(object.root)) {
    return false;
  }

  if (!!object.values) {
    return Object.entries(object.values).every(
      ([key, value]) => isStringifiedPath(key) && isTypeAnnotation(value)
    );
  }

  if (!!object.keys) {
    return Object.entries(object.keys).every(
      ([key, value]) => isStringifiedPath(key) && isKeyTypeAnnotation(value)
    );
  }

  return true;
}

export const makeAnnotator = () => {
  const annotations: Annotations = {};

  const annotator: Walker = ({ path, node }) => {
    if (is.map(node)) {
      const newNode = new Map<string, any>();

      for (const [key, value] of node.entries()) {
        const transformed = transformKey(key);
        if (transformed) {
          newNode.set(transformed.key, value);

          if (!annotations.keys) {
            annotations.keys = {};
          }

          annotations.keys[stringifyPath([...path, transformed.key])] =
            transformed.type;
        }
      }

      node = newNode;
    }

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

  if (annotations.keys) {
    for (const [key, type] of Object.entries(annotations.keys)) {
      const path = parsePath(key);
      const mapKey = path[path.length - 1];
      const pathToMap = path.slice(0, path.length - 1);

      const untransformedKey = untransformKey(mapKey, type);

      plain = mapDeep(plain, pathToMap, (v: Map<any, any>) => {
        v.set(untransformedKey, v.get(mapKey));
        v.delete(mapKey);
        return v;
      });
    }
  }

  if (annotations.root) {
    plain = untransformValue(plain, annotations.root);
  }

  return plain;
};
