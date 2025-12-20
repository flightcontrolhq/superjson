import {
  isArray,
  isEmptyObject,
  isError,
  isMap,
  isPlainObject,
  isPrimitive,
  isSet,
} from './is.js';
import { escapeKey, stringifyPath } from './pathstringifier.js';
import {
  isInstanceOfRegisteredClass,
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
type InnerNode<T> = [T, Record<string, Tree<T>>];

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
    forEach(children, (child, key) => {
      traverse(child, walker, version, [
        ...origin,
        ...parsePath(key, legacyPaths),
      ]);
    });
  }

  walker(nodeValue, origin);
}

export function applyValueAnnotations(
  plain: any,
  annotations: MinimisedTree<TypeAnnotation>,
  referentialEqualityAnnotations: ReferentialEqualityAnnotations | undefined,
  version: number,
  superJson: SuperJSON
) {
  const byproduct = new Map<any, string[]>;
  let rootIdentities: string[] | undefined;

  if (referentialEqualityAnnotations !== undefined) {
    function apply(identicalPaths: string[], path: string) {
      byproduct.set(path, identicalPaths);
    }

    if (isArray(referentialEqualityAnnotations)) {
      const [root, other] = referentialEqualityAnnotations;
      rootIdentities = root;
      if (other) {
        forEach(other, apply);
      }
    } else {
      forEach(referentialEqualityAnnotations, apply);
    }
  }

  const seen = byproduct.size ? new Set<string>() : undefined;

  const pathsWithValueAnnotation = new Set<string>();
  let rootValueAnnotation: TypeAnnotation | undefined = undefined;
  traverse(
    annotations,
    (type, path) => {
      if (path.length === 0)
        rootValueAnnotation = type;
      else
        pathsWithValueAnnotation.add(stringifyPath(path))
    },
    version
  )

  for (const [path, identicalPaths] of byproduct) {
    if (pathsWithValueAnnotation.has(path))
      continue;
    const original = getDeep(plain, parsePath(path, true)) as any;
    for (const other of identicalPaths)
      plain = setDeep(plain, parsePath(other, true), () => original)
  }
  if (rootIdentities && !rootValueAnnotation) {
    for (const other of rootIdentities)
      plain = setDeep(plain, parsePath(other, true), () => plain)
  }

  traverse(
    annotations,
    (type, path) => {
      if (path.length === 0) {
        if (rootIdentities) {
          if (type === 'set') {
            const newValue = new Set();
            for (const other of rootIdentities) {
              plain = setDeep(plain, parsePath(other, false), () => newValue);
            }
            for (const value of plain) {
              newValue.add(value)
            }
            plain = newValue;
            return;
          }
          if (type === 'map') {
            const newValue = new Map();
            for (const other of rootIdentities) {
              plain = setDeep(plain, parsePath(other, false), () => newValue);
            }
            for (const [key, value] of plain) {
              newValue.set(key, value);
            }
            plain = newValue;
            return;
          }

          throw new Error("If my understanding of the code is correct, this is unreachable")
        } else {
          plain = untransformValue(plain, type, superJson)
        }
        return;
      }

      if (seen?.has(stringifyPath(path)))
        return;

      const identical = byproduct.get(stringifyPath(path));
      if (identical) {
        identical.forEach(p => seen?.add(p));
        if (type === 'set') {
          const oldValue = getDeep(plain, path) as any[];
          const newValue = new Set();
          for (const other of identical) {
            plain = setDeep(plain, parsePath(other, false), () => newValue);
          }
          for (const value of oldValue) {
            newValue.add(value);
          }
          plain = setDeep(plain, path, () => newValue);
          return;
        }

        if (type === 'map') {
          const oldValue = getDeep(plain, path) as [any, any][];
          const newValue = new Map();
          for (const other of identical) {
            plain = setDeep(plain, parsePath(other, false), () => newValue);
          }
          for (const [key, value] of oldValue) {
            newValue.set(key, value);
          }
          plain = setDeep(plain, path, () => newValue);
          return;
        }

        const oldValue = getDeep(plain, path);
        const newValue = untransformValue(oldValue, type, superJson);
        plain = setDeep(plain, path, () => newValue);
        for (const other of identical) {
          plain = setDeep(plain, parsePath(other, false), () => newValue)
        }
      } else {
        plain = setDeep(plain, path, v => untransformValue(v, type, superJson));
      }
    },
    version
  );

  return plain;
}

const isDeep = (object: any, superJson: SuperJSON): boolean =>
  isPlainObject(object) ||
  isArray(object) ||
  isMap(object) ||
  isSet(object) ||
  isError(object) ||
  isInstanceOfRegisteredClass(object, superJson);

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

export const walker = (
  object: any,
  identities: Map<any, any[][]>,
  superJson: SuperJSON,
  dedupe: boolean,
  path: any[] = [],
  objectsInThisPath: any[] = [],
  seenObjects = new Map<unknown, Result>()
): Result => {
  const primitive = isPrimitive(object);

  if (!primitive) {
    addIdentity(object, path, identities);

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

  if (!isDeep(object, superJson)) {
    const transformed = transformValue(object, superJson);

    const result: Result = transformed
      ? {
          transformedValue: transformed.value,
          annotations: [transformed.type],
        }
      : {
          transformedValue: object,
        };
    if (!primitive) {
      seenObjects.set(object, result);
    }
    return result;
  }

  if (includes(objectsInThisPath, object)) {
    // prevent circular references
    return {
      transformedValue: null,
    };
  }

  const transformationResult = transformValue(object, superJson);
  const transformed = transformationResult?.value ?? object;

  const transformedValue: any = isArray(transformed) ? [] : {};
  const innerAnnotations: Record<string, Tree<TypeAnnotation>> = {};

  forEach(transformed, (value, index) => {
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
        annotations: !!transformationResult
          ? [transformationResult.type]
          : undefined,
      }
    : {
        transformedValue,
        annotations: !!transformationResult
          ? [transformationResult.type, innerAnnotations]
          : innerAnnotations,
      };
  if (!primitive) {
    seenObjects.set(object, result);
  }

  return result;
};
