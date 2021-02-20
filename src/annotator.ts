import { getDeep, setDeep } from './accessDeep';
import { TypeAnnotation, untransformValue } from './transformer';
import { CollapsedRootTree, traversePathTree } from './pathtree';
import { parsePath, stringifyPath } from './pathstringifier';
import { forEach } from 'lodash';
import { isArray, isEmptyObject } from './is';

export interface Annotations {
  values?: CollapsedRootTree<TypeAnnotation>;
  referentialEqualities?:
    | Record<string, string[]>
    | [string[]]
    | [string[], Record<string, string[]>];
}

export function createReferentialEqualityAnnotation(
  identitites: Map<any, any[][]>
): Annotations['referentialEqualities'] {
  const result: Record<string, string[]> = {};
  let rootEqualityPaths: string[] | undefined = undefined;

  identitites.forEach(paths => {
    if (paths.length <= 1) {
      return;
    }

    const [shortestPath, ...identicalPaths] = paths
      .map(path => path.map(String))
      .sort((a, b) => a.length - b.length);

    if (shortestPath.length === 0) {
      rootEqualityPaths = identicalPaths.map(stringifyPath);
    } else {
      result[stringifyPath(shortestPath)] = identicalPaths.map(stringifyPath);
    }
  });

  if (rootEqualityPaths) {
    if (isEmptyObject(result)) {
      return [rootEqualityPaths];
    } else {
      return [rootEqualityPaths, result];
    }
  } else {
    return isEmptyObject(result) ? undefined : result;
  }
}

export const applyAnnotations = (plain: any, annotations: Annotations): any => {
  if (annotations.values) {
    traversePathTree(annotations.values, (type, path) => {
      plain = setDeep(plain, path, v => untransformValue(v, type));
    });
  }

  if (annotations.referentialEqualities) {
    if (isArray(annotations.referentialEqualities)) {
      forEach(annotations.referentialEqualities[0], identicalPath => {
        plain = setDeep(plain, parsePath(identicalPath), () => plain);
      });
    }

    forEach(
      isArray(annotations.referentialEqualities)
        ? annotations.referentialEqualities[1]
        : annotations.referentialEqualities,
      (identicalPaths, path) => {
        const object = getDeep(plain, parsePath(path));

        identicalPaths.map(parsePath).forEach(identicalObjectPath => {
          plain = setDeep(plain, identicalObjectPath, () => object);
        });
      }
    );
  }

  return plain;
};
