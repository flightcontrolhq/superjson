import {
  isArray,
  isEmptyObject,
  isMap,
  isPlainObject,
  isPrimitive,
  isSet,
} from './is';
import { escapeKey, stringifyPath } from './pathstringifier';
import {
  isInstanceOfRegisteredClass,
  transformValue,
  TypeAnnotation,
  untransformValue,
} from './transformer';
import { includes, forEach } from './util';
import { parsePath } from './pathstringifier';
import { getDeep, setDeep } from './accessDeep';

type Tree<T> = InnerNode<T> | Leaf<T>;
type Leaf<T> = [T];
type InnerNode<T> = [T, Record<string, Tree<T>>];

export type MinimisedTree<T> = Tree<T> | Record<string, Tree<T>> | undefined;

function traverse<T>(
  tree: MinimisedTree<T>,
  walker: (v: T, path: string[]) => void,
  origin: string[] = []
): void {
  if (!tree) {
    return;
  }

  if (!isArray(tree)) {
    forEach(tree, (subtree, key) =>
      traverse(subtree, walker, [...origin, ...parsePath(key)])
    );
    return;
  }

  const [nodeValue, children] = tree;
  if (children) {
    forEach(children, (child, key) => {
      traverse(child, walker, [...origin, ...parsePath(key)]);
    });
  }

  walker(nodeValue, origin);
}

export function applyValueAnnotations(
  plain: any,
  annotations: MinimisedTree<TypeAnnotation>
) {
  traverse(annotations, (type, path) => {
    plain = setDeep(plain, path, v => untransformValue(v, type));
  });

  return plain;
}

export function applyReferentialEqualityAnnotations(
  plain: any,
  annotations: ReferentialEqualityAnnotations
) {
  function apply(identicalPaths: string[], path: string) {
    const object = getDeep(plain, parsePath(path));

    identicalPaths.map(parsePath).forEach(identicalObjectPath => {
      plain = setDeep(plain, identicalObjectPath, () => object);
    });
  }

  if (isArray(annotations)) {
    const [root, other] = annotations;
    root.forEach(identicalPath => {
      plain = setDeep(plain, parsePath(identicalPath), () => plain);
    });

    if (other) {
      forEach(other, apply);
    }
  } else {
    forEach(annotations, apply);
  }

  return plain;
}

const isDeep = (object: any): boolean =>
  isPlainObject(object) ||
  isArray(object) ||
  isMap(object) ||
  isSet(object) ||
  isInstanceOfRegisteredClass(object);

function addIdentity(object: any, path: any[], identities: Map<any, any[][]>) {
  const existingSet = identities.get(object);

  if (existingSet) {
    existingSet.push(path);
  } else {
    identities.set(object, [path]);
  }
}

interface Result {
  transformedValue: any;
  annotations?: MinimisedTree<TypeAnnotation>;
}

export type ReferentialEqualityAnnotations =
  | Record<string, string[]>
  | [string[]]
  | [string[], Record<string, string[]>];

export function generateReferentialEqualityAnnotations(
  identitites: Map<any, any[][]>
): ReferentialEqualityAnnotations | undefined {
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

export const walker = (
  object: any,
  identities: Map<any, any[][]>,
  path: any[] = [],
  objectsInThisPath: any[] = []
): Result => {
  if (!isPrimitive(object)) {
    addIdentity(object, path, identities);
  }

  if (!isDeep(object)) {
    const transformed = transformValue(object);
    if (transformed) {
      return {
        transformedValue: transformed.value,
        annotations: [transformed.type],
      };
    } else {
      return {
        transformedValue: object,
      };
    }
  }

  if (includes(objectsInThisPath, object)) {
    return {
      transformedValue: null,
    };
  }

  const transformationResult = transformValue(object);
  const transformed = transformationResult?.value ?? object;

  if (!isPrimitive(object)) {
    objectsInThisPath = [...objectsInThisPath, object];
  }

  const transformedValue: any = isArray(transformed) ? [] : {};
  const innerAnnotations: Record<string, Tree<TypeAnnotation>> = {};

  forEach(transformed, (value, index) => {
    const recursiveResult = walker(
      value,
      identities,
      [...path, index],
      objectsInThisPath
    );

    transformedValue[index] = recursiveResult.transformedValue;

    if (isArray(recursiveResult.annotations)) {
      innerAnnotations[index] = recursiveResult.annotations;
    } else if (isPlainObject(recursiveResult.annotations)) {
      forEach(recursiveResult.annotations, (tree, key) => {
        innerAnnotations[escapeKey(index) + '.' + key] = tree;
      });
    }
  });

  if (isEmptyObject(innerAnnotations)) {
    return {
      transformedValue,
      annotations: !!transformationResult
        ? [transformationResult.type]
        : undefined,
    };
  } else {
    return {
      transformedValue,
      annotations: !!transformationResult
        ? [transformationResult.type, innerAnnotations]
        : innerAnnotations,
    };
  }
};
