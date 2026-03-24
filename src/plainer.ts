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
type InnerNode<T> = [T, MinimisedTree<T>];

export type MinimisedTree<T> =
  | Tree<T>
  | { [k: string]: MinimisedTree<T> }
  | undefined;

const enableLegacyPaths = (version: number) => version < 1;

function traverseObject<T>(
  tree: { [k: string]: MinimisedTree<T> },
  walker: (type: any, path: string[], strPath?: string) => void,
  legacyPaths: boolean,
  origin: string[],
  strOrigin: string | undefined = undefined
) {
  forEach(tree, (subtree, key) => {
    traverse(
      subtree,
      walker,
      legacyPaths,
      [...origin, ...parsePath(key, legacyPaths)],
      strOrigin !== undefined ? strOrigin + '.' + key : key
    );
  });
}

function traverse<T>(
  tree: MinimisedTree<T>,
  walker: (type: any, path: string[], strPath?: string) => void,
  legacyPaths: boolean,
  origin: string[] = [],
  strOrigin: string | undefined = undefined
): void {
  if (!tree) {
    return;
  }

  if (!isArray(tree)) {
    traverseObject(tree, walker, legacyPaths, origin, strOrigin);
    return;
  }

  const [nodeValue, children] = tree;
  if (children) {
    if (isArray(children)) {
      traverse(children, walker, legacyPaths, origin);
    } else {
      traverseObject(children, walker, legacyPaths, origin, strOrigin);
    }
  }

  walker(nodeValue, origin, strOrigin);
}

/**
 * Function to parse referential equalities object into:
 *  - root: Array of root referential equalities to loop and apply them at the end
 *  - other: Map of 'representative paths' -> 'parsed duplicate paths'
 *  - duplicate: Set of all duplicate (non-representative) paths to skip them in walker
 *    when applying value annotations
 */
function parseReferentialEqualities(
  referentialEqualities: ReferentialEqualityAnnotations | undefined,
  legacyPaths: boolean
) {
  // Extract root and other from referentialEqualities
  let root: string[] | undefined;
  let other: Record<string, string[]> | undefined;
  if (isArray(referentialEqualities)) {
    const [r, o] = referentialEqualities;
    root = r;
    other = o;
  } else {
    other = referentialEqualities;
  }

  const rootArray = root?.map(p => parsePath(p, legacyPaths)) ?? [];

  const otherMap = new Map<string, string[][]>();
  const duplicateSet = new Set<string>();
  if (other) {
    for (const [rep, iden] of Object.entries(other)) {
      otherMap.set(
        rep,
        iden.map(p => parsePath(p, legacyPaths))
      );
      for (const p of iden) duplicateSet.add(p);
    }
  }

  // Return root array and other map
  return { root: rootArray, other: otherMap, duplicate: duplicateSet };
}

export type MetaObject = {
  values?: MinimisedTree<TypeAnnotation>;
  referentialEqualities?: ReferentialEqualityAnnotations;
  v?: number;
};

/**
 * This function apply meta object (value and referential equalities annotations) to JSON input.
 *
 * Behavior:
 *  - 1. Apply all non-root referential equalities first so recursive value annotations get proper input even with dedupe=true
 *  - 2. Apply value annotations, while also check referential equality:
 *    - A. If node is duplicate skip the annotation
 *    - B. If node is representative update all duplicate nodes
 *    - C. If not referentially equal to any other node apply annotation normally
 *  - 3. Apply root referential equalities
 *
 * @returns Modified JSON after applying value and referential equalities annotations
 */
export function applyMeta(
  json: any,
  meta: MetaObject,
  superJson: SuperJSON
): any {
  // Handle version
  const version = meta.v ?? 0;
  const legacyPaths = enableLegacyPaths(version);

  // Parse referenial equality object (parsed once for performance)
  const { root, other, duplicate } = parseReferentialEqualities(
    meta.referentialEqualities,
    legacyPaths
  );

  // Function to set referential equality
  const setReferentialEqualityFn = (
    representativePath: string[],
    identicalPaths: string[][]
  ) => {
    const object = getDeep(json, representativePath);
    for (const p of identicalPaths) json = setDeep(json, p, () => object);
  };

  // Function to set value annotation, It also update referential equality if needed
  const setValueAnnotationsFn = (
    type: any,
    path: string[],
    strPath?: string
  ) => {
    // Skip on duplicate paths (Will be updated by representative path)
    if (strPath && duplicate.has(strPath)) return;
    // Update json
    json = setDeep(json, path, v => untransformValue(v, type, superJson));
    // If node is representative update all duplicate paths
    const refPaths = strPath && other.get(strPath);
    if (refPaths) setReferentialEqualityFn(path, refPaths);
  };

  // Apply other referential equality
  for (const [rep, iden] of other) {
    setReferentialEqualityFn(parsePath(rep, legacyPaths), iden);
  }

  // Apply value annotations and in-place referential equality if node is updated
  traverse(meta.values, setValueAnnotationsFn, legacyPaths);

  // Apply root referential equalities
  for (const p of root) {
    json = setDeep(json, p, () => json);
  }

  // return modified json
  return json;
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

/**
 * Walker to serialize input. It supports recursive custom transformations so 'walker' also applied to return
 * of transformations if needed.
 *
 * Known limitation:
 *  - Return of recursive custom will always be considered new object even if defined in the tree else where (referential
 * equality is blocked on the same path) so it will be linked in referential equality nor be deduped, This limitation is
 * intentional to avoid making code too complex where we need to store and compare depths if multple objects are defined
 * at the same path during transformation.
 */
export const walker = (
  object: any,
  identities: Map<any, any[][]>,
  superJson: SuperJSON,
  dedupe: boolean,
  path: string[] = [],
  objectsInThisPath: any[] = [],
  seenObjects = new Map<unknown, Result>(),
  isSamePath: boolean = false
): Result => {
  const primitive = isPrimitive(object);
  const registerSeen = !primitive && !isSamePath;

  if (registerSeen) {
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
      if (registerSeen) seenObjects.set(object, result);
      return result;
    }

    // recurse if transformer mark value as deep
    objectsInThisPath.push(object);
    const recursiveResult = walker(
      value,
      identities,
      superJson,
      dedupe,
      path,
      objectsInThisPath,
      seenObjects,
      true
    );
    objectsInThisPath.pop();

    const result: Result = recursiveResult.annotations
      ? {
          transformedValue: recursiveResult.transformedValue,
          annotations: [type, recursiveResult.annotations],
        }
      : {
          transformedValue: recursiveResult.transformedValue,
          annotations: [type],
        };

    if (registerSeen) seenObjects.set(object, result);
    return result;
  }

  // Handle value if plain object or array
  if (isPlainObjectOrArray(object)) {
    const transformedValue: any = isArray(object) ? [] : {};
    const innerAnnotations: Record<string, MinimisedTree<TypeAnnotation>> = {};

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

      objectsInThisPath.push(object);
      const recursiveResult = walker(
        value,
        identities,
        superJson,
        dedupe,
        [...path, index],
        objectsInThisPath,
        seenObjects,
        false
      );
      objectsInThisPath.pop();

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

    if (registerSeen) seenObjects.set(object, result);
    return result;
  }

  // Return value as is
  const result = {
    transformedValue: object,
  };
  if (registerSeen) seenObjects.set(object, result);
  return result;
};
