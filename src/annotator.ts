import { getDeep, setDeep } from './accessDeep';
import { isPrimitive, isNull, isString } from './is';
import * as IteratorUtils from './iteratorutils';
import { Walker } from './plainer';
import {
  TypeAnnotation,
  isTypeAnnotation,
  transformValue,
  untransformValue,
} from './transformer';
import { PathTree } from './pathtree';

export interface Annotations {
  values?: PathTree.MinimizedTree<TypeAnnotation>;
  referentialEqualities?: PathTree.MinimizedTree<
    PathTree.MinimizedTree<string>
  >;
}

export function isAnnotations(object: any): object is Annotations {
  try {
    if (object.values) {
      if (!PathTree.isMinimizedTree(object.values, isTypeAnnotation)) {
        return false;
      }
    }

    if (object.referentialEqualities) {
      if (
        !PathTree.isMinimizedTree(object.referentialEqualities, tree =>
          PathTree.isMinimizedTree(tree, isString)
        )
      ) {
        return false;
      }
    }

    return true;
  } catch (error) {
    return false;
  }
}

export const makeAnnotator = () => {
  let valueAnnotations = PathTree.create<TypeAnnotation | null>(null);

  const objectIdentities = new Map<any, any[][]>();
  function registerObjectPath(object: any, path: any[]) {
    const paths = objectIdentities.get(object) ?? [];
    paths.push(path);
    objectIdentities.set(object, paths);
  }

  const annotator: Walker = ({ path, node }) => {
    if (!isPrimitive(node)) {
      registerObjectPath(node, path);
    }

    const transformed = transformValue(node);

    if (transformed) {
      valueAnnotations = PathTree.append(
        valueAnnotations,
        path.map(String),
        transformed.type
      );

      return transformed.value;
    } else {
      return node;
    }
  };

  function getAnnotations(): Annotations {
    const annotations: Annotations = {};

    const valueAnnotationsMinimized = PathTree.minimize(valueAnnotations);
    if (valueAnnotationsMinimized) {
      annotations.values = valueAnnotationsMinimized;
    }

    let referentialEqualitiesAnnotations = PathTree.create<PathTree.MinimizedTree<
      string
    > | null>(null);

    IteratorUtils.forEach(objectIdentities.values(), paths => {
      if (paths.length <= 1) {
        return;
      }

      const [shortestPath, ...identityPaths] = paths
        .map(path => path.map(String))
        .sort((a, b) => a.length - b.length);
      let identities = PathTree.create<string | null>(null);
      for (const identityPath of identityPaths) {
        identities = PathTree.appendPath(identities, identityPath);
      }

      const minimizedIdentities = PathTree.minimize(identities);
      if (!minimizedIdentities) {
        throw new Error('Illegal State');
      }

      referentialEqualitiesAnnotations = PathTree.append(
        referentialEqualitiesAnnotations,
        shortestPath,
        minimizedIdentities
      );
    });

    const referentialEqualitiesAnnotationsMinimized = PathTree.minimize(
      referentialEqualitiesAnnotations
    );
    if (referentialEqualitiesAnnotationsMinimized) {
      annotations.referentialEqualities = referentialEqualitiesAnnotationsMinimized;
    }

    return annotations;
  }

  return { getAnnotations, annotator };
};

export const applyAnnotations = (plain: any, annotations: Annotations): any => {
  if (annotations.values) {
    PathTree.traverse(PathTree.unminimize(annotations.values), (type, path) => {
      if (isNull(type)) {
        if (path.length === 0) {
          return;
        }

        throw new Error('Illegal State');
      }

      plain = setDeep(plain, path, v => untransformValue(v, type));
    });
  }

  if (annotations.referentialEqualities) {
    PathTree.traverse(
      PathTree.unminimize(annotations.referentialEqualities),
      (identicalObjects, path) => {
        if (isNull(identicalObjects)) {
          if (path.length === 0) {
            return;
          }

          throw new Error('Illegal State');
        }

        const object = getDeep(plain, path);

        PathTree.traversePaths(
          PathTree.unminimize(identicalObjects),
          identicalObjectPath => {
            plain = setDeep(plain, identicalObjectPath, () => object);
          }
        );
      }
    );
  }

  return plain;
};
