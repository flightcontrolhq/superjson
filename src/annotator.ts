import is from '@sindresorhus/is';

import { setDeep, getDeep } from './accessDeep';
import {
  StringifiedPath,
  isStringifiedPath,
  parsePath,
  stringifyPath,
} from './pathstringifier';
import { Walker } from './plainer';
import {
  KeyTypeAnnotation,
  TypeAnnotation,
  isKeyTypeAnnotation,
  isTypeAnnotation,
  transformKey,
  transformValue,
  untransformKey,
  untransformValue,
} from './transformer';

export interface Annotations {
  root?: TypeAnnotation;
  values?: Record<StringifiedPath, TypeAnnotation>;
  referentialEqualities?: Record<StringifiedPath, StringifiedPath[]>;
  keys?: Record<StringifiedPath, KeyTypeAnnotation>;
}

export function isAnnotations(object: any): object is Annotations {
  try {
    if (!!object.root && !isTypeAnnotation(object.root)) {
      return false;
    }
  
    if (!!object.values) {
      return Object.entries(object.values).every(
        ([key, value]) => isStringifiedPath(key) && isTypeAnnotation(value)
      );
    }
  
    if (!!object.referentialEqualities) {
      return Object.entries(object.referentialEqualities).every(
        ([key, value]) => isStringifiedPath(key) && (value as string[]).every(isStringifiedPath)
      );
    }
  
    if (!!object.keys) {
      return Object.entries(object.keys).every(
        ([key, value]) => isStringifiedPath(key) && isKeyTypeAnnotation(value)
      );
    }
  
    return true;
  } catch (error) {
    return false;
  }
}

export const makeAnnotator = () => {
  const annotations: Annotations = {};

  const objectIdentities = new Map<any, any[][]>();
  function registerObjectPath(object: any, path: any[]) {
    const paths = objectIdentities.get(object) ?? []
    paths.push(path)
    objectIdentities.set(object, paths)
  }

  const annotator: Walker = ({ path, node }) => {
    if (!is.primitive(node)) {
      registerObjectPath(node, path);
    }
    

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

  function getAnnotations(): Annotations {
    for (const paths of objectIdentities.values()) {
      if (paths.length > 1) {
        const [ shortestPath, ...identityPaths ] = paths.sort((a, b) => a.length - b.length).map(stringifyPath)

        if (!annotations.referentialEqualities) {
          annotations.referentialEqualities = {}
        }

        annotations.referentialEqualities[shortestPath] = identityPaths
      }
    }

    return annotations;
  }

  return { getAnnotations, annotator };
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
      plain = setDeep(plain, path, v =>
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

      plain = setDeep(plain, pathToMap, (v: Map<any, any>) => {
        v.set(untransformedKey, v.get(mapKey));
        v.delete(mapKey);
        return v;
      });
    }
  }

  if (annotations.root) {
    plain = untransformValue(plain, annotations.root);
  }

  if (annotations.referentialEqualities) {
    for (const [objectPath, identicalObjectsPaths] of Object.entries(annotations.referentialEqualities)) {
      const object = getDeep(plain, parsePath(objectPath))
      
      for (const identicalObjectPath of identicalObjectsPaths.map(parsePath)) {
        setDeep(plain, identicalObjectPath, () => object)
      }
    }
  }

  return plain;
};
