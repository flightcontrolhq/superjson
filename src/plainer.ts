import { isArray, isEmptyObject, isPlainObject, isPrimitive } from './is.js';
import { escapeKey, stringifyPath } from './pathstringifier.js';
import {
  transformValue,
  TypeAnnotation,
  untransformValue,
} from './transformer.js';
import { includes, forEach } from './util.js';
import { parsePath } from './pathstringifier.js';
import { getDeep, setDeep } from './accessDeep.js';
import SuperJSON from './index.js';

type Tree<T> = InnerNode<T> | Leaf<T>;
type Leaf<T> = [T];
type InnerNode<T> = [T, Tree<T> | Record<string, Tree<T>>];

export type MinimisedTree<T> = Tree<T> | Record<string, Tree<T>> | undefined;

const enableLegacyPaths = (version: number) => version < 1;

function traverse<T>(
  tree: MinimisedTree<T>,
  walker: (v: T, path: string[]) => void,
  version: number,
  origin: string[] = []
): void {
  if (!tree) {
    return;
  }

  const legacyPaths = enableLegacyPaths(version);
  if (!isArray(tree)) {
    forEach(tree, (subtree, key) =>
      traverse(subtree, walker, version, [
        ...origin,
        ...parsePath(key, legacyPaths),
      ])
    );
    return;
  }

  const [nodeValue, children] = tree;
  if (children) {
    if (isArray(children)) {
      traverse(children, walker, version, origin);
    } else {
      forEach(children, (child, key) => {
        traverse(child, walker, version, [
          ...origin,
          ...parsePath(key, legacyPaths),
        ]);
      });
    }
  }

  walker(nodeValue, origin);
}

export function applyValueAnnotations(
  plain: any,
  annotations: MinimisedTree<TypeAnnotation>,
  version: number,
  superJson: SuperJSON
) {
  traverse(
    annotations,
    (type, path) => {
      plain = setDeep(plain, path, v => untransformValue(v, type, superJson));
    },
    version
  );

  return plain;
}

export function applyReferentialEqualityAnnotations(
  plain: any,
  annotations: ReferentialEqualityAnnotations,
  version: number
) {
  const legacyPaths = enableLegacyPaths(version);
  function apply(identicalPaths: string[], path: string) {
    const object = getDeep(plain, parsePath(path, legacyPaths));

    identicalPaths
      .map(path => parsePath(path, legacyPaths))
      .forEach(identicalObjectPath => {
        plain = setDeep(plain, identicalObjectPath, () => object);
      });
  }

  if (isArray(annotations)) {
    const [root, other] = annotations;
    root.forEach(identicalPath => {
      plain = setDeep(
        plain,
        parsePath(identicalPath, legacyPaths),
        () => plain
      );
    });

    if (other) {
      forEach(other, apply);
    }
  } else {
    forEach(annotations, apply);
  }

  return plain;
}

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
  identitites: Map<any, any[][]>,
  dedupe: boolean
): ReferentialEqualityAnnotations | undefined {
  const result: Record<string, string[]> = {};
  let rootEqualityPaths: string[] | undefined = undefined;

  identitites.forEach(paths => {
    if (paths.length <= 1) {
      return;
    }

    // if we're not deduping, all of these objects continue existing.
    // putting the shortest path first makes it easier to parse for humans
    // if we're deduping though, only the first entry will still exist, so we can't do this optimisation.
    if (!dedupe) {
      paths = paths
        .map(path => path.map(String))
        .sort((a, b) => a.length - b.length);
    }

    const [representativePath, ...identicalPaths] = paths;

    if (representativePath.length === 0) {
      rootEqualityPaths = identicalPaths.map(stringifyPath);
    } else {
      result[stringifyPath(representativePath)] = identicalPaths.map(
        stringifyPath
      );
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

const isPlainObjectOrArray = (object: any) =>
  isPlainObject(object) || isArray(object);

export const walker = (
  object: any,
  identities: Map<any, any[][]>,
  superJson: SuperJSON,
  dedupe: boolean,
  path: any[] = [],
  objectsInThisPath: any[] = [],
  seenObjects = new Map<unknown, Result>(),
  isTransformation: boolean = false // Prevent overwrite of original object in identities map in recursive transformtion
): Result => {
  const primitive = isPrimitive(object);

  if (!primitive) {
    if (!isTransformation) addIdentity(object, path, identities);

    const seen = seenObjects.get(object);
    if (seen) {
      // short-circuit result if we've seen this object before
      return dedupe
        ? {
            transformedValue: null,
          }
        : seen;
    }
  }

  if (includes(objectsInThisPath, object)) {
    // prevent circular references
    return {
      transformedValue: null,
    };
  }

  // Try to tansform object (apply composite or simple rule if applicable)
  const transformationResult = transformValue(object, superJson);

  // Handle value if transformed
  if (transformationResult) {
    const { value, type, isDeep } = transformationResult;

    // If transformer mark value as non deep return it
    if (!isDeep) {
      const result: Result = {
        transformedValue: value,
        annotations: [type],
      };
      if (!primitive) seenObjects.set(object, result);
      return result;
    }

    // recurse if transformer mark value as deep
    const recursiveResult = walker(
      value,
      identities,
      superJson,
      dedupe,
      path,
      [...objectsInThisPath, object],
      seenObjects,
      true
    );

    const result: Result = recursiveResult.annotations
      ? {
          transformedValue: recursiveResult.transformedValue,
          annotations: [type, recursiveResult.annotations],
        }
      : {
          transformedValue: recursiveResult.transformedValue,
          annotations: [type],
        };

    if (!primitive) seenObjects.set(object, result);
    return result;
  }

  // Handle value if plain object or array
  if (isPlainObjectOrArray(object)) {
    const transformedValue: any = isArray(object) ? [] : {};
    const innerAnnotations: Record<string, Tree<TypeAnnotation>> = {};

    forEach(object, (value, index) => {
      if (
        index === '__proto__' ||
        index === 'constructor' ||
        index === 'prototype'
      ) {
        throw new Error(
          `Detected property ${index}. This is a prototype pollution risk, please remove it from your object.`
        );
      }

      const recursiveResult = walker(
        value,
        identities,
        superJson,
        dedupe,
        [...path, index],
        [...objectsInThisPath, object],
        seenObjects
      );

      transformedValue[index] = recursiveResult.transformedValue;

      if (isArray(recursiveResult.annotations)) {
        innerAnnotations[escapeKey(index)] = recursiveResult.annotations;
      } else if (isPlainObject(recursiveResult.annotations)) {
        forEach(recursiveResult.annotations, (tree, key) => {
          innerAnnotations[escapeKey(index) + '.' + key] = tree;
        });
      }
    });

    const result: Result = isEmptyObject(innerAnnotations)
      ? {
          transformedValue,
        }
      : {
          transformedValue,
          annotations: innerAnnotations,
        };

    if (!primitive) seenObjects.set(object, result);
    return result;
  }

  // Return value as is
  const result = {
    transformedValue: object,
  };
  if (!primitive) seenObjects.set(object, result);
  return result;
};
