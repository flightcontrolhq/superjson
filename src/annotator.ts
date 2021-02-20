import { getDeep, setDeep } from './accessDeep';
import { isString } from './is';
import {
  TypeAnnotation,
  isTypeAnnotation,
  untransformValue,
} from './transformer';
import { PathTree } from './pathtree';

export interface Annotations {
  values?: PathTree.CollapsedRootTree<TypeAnnotation>;
  referentialEqualities?: PathTree.CollapsedRootTree<
    PathTree.CollapsedRootTree<string>
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

export function createReferentialEqualityAnnotation(
  identitites: Map<any, any[][]>
) {
  let tree = PathTree.create<PathTree.CollapsedRootTree<string> | null>(null);

  identitites.forEach(paths => {
    if (paths.length <= 1) {
      return;
    }

    const [shortestPath, ...identicalPaths] = paths
      .map(path => path.map(String))
      .sort((a, b) => a.length - b.length);

    let identities = PathTree.create<string | null>(null);
    identicalPaths.forEach(identicalPath => {
      PathTree.appendPath(identities, identicalPath);
    });

    const minimizedIdentities = PathTree.collapseRoot(identities);
    if (!minimizedIdentities) {
      throw new Error('Illegal State');
    }

    PathTree.append(tree, shortestPath, minimizedIdentities);
  });

  return PathTree.collapseRoot(tree);
}

export const applyAnnotations = (plain: any, annotations: Annotations): any => {
  if (annotations.values) {
    PathTree.traverseWhileIgnoringNullRoot(
      PathTree.expandRoot(annotations.values),
      (type, path) => {
        plain = setDeep(plain, path, v => untransformValue(v, type));
      }
    );
  }

  if (annotations.referentialEqualities) {
    PathTree.traverseWhileIgnoringNullRoot(
      PathTree.expandRoot(annotations.referentialEqualities),
      (identicalObjects, path) => {
        const object = getDeep(plain, path);

        PathTree.traversePaths(
          PathTree.expandRoot(identicalObjects),
          identicalObjectPath => {
            plain = setDeep(plain, identicalObjectPath, () => object);
          }
        );
      }
    );
  }

  return plain;
};
