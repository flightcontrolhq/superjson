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
const enableDepthSegment = (version: number) => version > 1;

function stringifyPathWithDepth(value: [any[], number]) {
  const path = value[0];
  const depth = value[1];
  return stringifyPath(path) + (depth ? '.$' + depth : '');
}

function traverse<T>(
  tree: MinimisedTree<T>,
  walker: (
    type: any,
    path: string[],
    equalityGroup: ReferentialEqualityGroup | undefined
  ) => void,
  equalityGroups: Map<string, ReferentialEqualityGroup>,
  legacyPaths: boolean,
  depthSegment: boolean,
  origin: string[] = [],
  samePathDepth: number = 0
): void {
  if (!tree) {
    return;
  }

  const equalityGroup = equalityGroups.get(
    stringifyPathWithDepth([origin, samePathDepth])
  );

  if (equalityGroup) {
    if (equalityGroup.resolved) return;
    equalityGroup.resolved = true;
  }

  if (!isArray(tree)) {
    // Map to store each path and resolved state when looping forEach
    const seenPaths = new Map<string, boolean>();
    // Loop tree
    forEach(tree, (subtree, key) => {
      // parse key
      const parsedKey = parsePath(key, legacyPaths, depthSegment);

      // initiate child path
      const childPath = [...origin];

      // As keys can be 'key1.key2.key3' loop parsed key and ensure to path is duplicate and so should be skipped
      // We skip last key as it will be handled separetly in next traverse function
      for (let i = 0; i < parsedKey.length - 1; i++) {
        // Update child path and stringify it
        childPath.push(parsedKey[i]);
        const path = stringifyPathWithDepth([childPath, 0]);

        // check if path already seen, if yes handle according to already stored value
        let resolved;
        if ((resolved = seenPaths.get(path)) !== undefined) {
          if (resolved) return;
          continue;
        }

        // check if path is in equality group, if yes handle it and stored resolved state in seen paths
        const equalityGroup = equalityGroups.get(path);
        if (equalityGroup) {
          const resolved = equalityGroup.resolved;
          equalityGroup.resolved = true;
          seenPaths.set(path, resolved);
          if (resolved) return;
        }
      }

      // Add last key to the child path
      childPath.push(parsedKey[parsedKey.length - 1]);

      traverse(
        subtree,
        walker,
        equalityGroups,
        legacyPaths,
        depthSegment,
        childPath,
        0
      );
    });

    return;
  }

  const [nodeValue, children] = tree;
  if (children) {
    traverse(
      children,
      walker,
      equalityGroups,
      legacyPaths,
      depthSegment,
      origin,
      samePathDepth + 1
    );
  }

  walker(nodeValue, origin, equalityGroup);
}

type ReferentialEqualityGroup = {
  representative: string[];
  duplicates: string[][];
  resolved: boolean;
};

function parseReferentialEqualities(
  referentialEqualities: ReferentialEqualityAnnotations | undefined,
  legacyPaths: boolean,
  depthSegment: boolean
) {
  let rootEqualityPaths: string[] | undefined;
  let nonRootGroups: Record<string, string[]> | undefined;
  if (isArray(referentialEqualities)) {
    const [root, nonRoot] = referentialEqualities;
    rootEqualityPaths = root;
    nonRootGroups = nonRoot;
  } else {
    nonRootGroups = referentialEqualities;
  }

  const parsedRootPaths =
    rootEqualityPaths?.map(path =>
      parsePath(path, legacyPaths, depthSegment)
    ) ?? [];

  const equalityGroupsByPath = new Map<string, ReferentialEqualityGroup>();
  const representativePaths = new Set<string>();

  if (nonRootGroups) {
    for (const [representativePath, duplicateOriginalPaths] of Object.entries(
      nonRootGroups
    )) {
      const parsedRepresentative = parsePath(
        representativePath,
        legacyPaths,
        depthSegment
      );

      const group: ReferentialEqualityGroup = {
        representative: parsedRepresentative,
        duplicates: [parsedRepresentative],
        resolved: false,
      };

      equalityGroupsByPath.set(representativePath, group);
      representativePaths.add(representativePath);

      for (const duplicateOriginalPath of duplicateOriginalPaths) {
        group.duplicates.push(
          parsePath(duplicateOriginalPath, legacyPaths, depthSegment)
        );
        equalityGroupsByPath.set(duplicateOriginalPath, group);
      }
    }
  }

  return {
    rootEqualities: parsedRootPaths,
    equalityGroups: equalityGroupsByPath,
    representatives: representativePaths,
  };
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
 *  - 2. Apply value annotations, while also updating referential equality nodes
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
  const depthSegment = enableDepthSegment(version);

  // Parse referenial equality object (parsed once for performance)
  const {
    rootEqualities,
    equalityGroups,
    representatives,
  } = parseReferentialEqualities(
    meta.referentialEqualities,
    legacyPaths,
    depthSegment
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
    equalityGroup: ReferentialEqualityGroup | undefined
  ) => {
    json = setDeep(json, path, v => untransformValue(v, type, superJson));

    // Set other referential equalities if present
    if (!equalityGroup) return;
    setReferentialEqualityFn(path, [...equalityGroup.duplicates]);
  };

  // Apply other referential equality
  for (const path of representatives) {
    const equalityGroup = equalityGroups.get(path)!;
    setReferentialEqualityFn(
      equalityGroup.representative,
      equalityGroup.duplicates
    );
  }

  // Apply value annotations and in-place referential equality if node is updated
  traverse(
    meta.values,
    setValueAnnotationsFn,
    equalityGroups,
    legacyPaths,
    depthSegment
  );

  // Apply root referential equalities
  for (const p of rootEqualities) {
    json = setDeep(json, p, () => json);
  }

  // return modified json
  return json;
}

function addIdentity(
  object: any,
  path: any[],
  samePathDepth: number,
  identities: Map<any, [any[], number][]>
) {
  const existingSet = identities.get(object);

  if (existingSet) {
    existingSet.push([path, samePathDepth]);
  } else {
    identities.set(object, [[path, samePathDepth]]);
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
  identitities: Map<any, [any[], number][]>,
  dedupe: boolean
): ReferentialEqualityAnnotations | undefined {
  const result: Record<string, string[]> = {};
  let rootEqualityPaths: string[] | undefined = undefined;

  identitities.forEach(paths => {
    if (paths.length <= 1) {
      return;
    }

    // if we're not deduping, all of these objects continue existing.
    // putting the shortest path first makes it easier to parse for humans
    // if we're deduping though, only the first entry will still exist, so we can't do this optimisation.
    if (!dedupe) {
      paths = paths.sort((a, b) => {
        if (a[1] !== b[1]) return a[1] - b[1]; // prefer depth 0
        return a[0].length - b[0].length;
      });
    }

    const [representativePath, ...identicalPaths] = paths;

    if (representativePath[0].length === 0) {
      rootEqualityPaths = identicalPaths.map(stringifyPathWithDepth);
    } else {
      result[stringifyPathWithDepth(representativePath)] = identicalPaths.map(
        stringifyPathWithDepth
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
  identities: Map<any, [any[], number][]>,
  superJson: SuperJSON,
  dedupe: boolean,
  path: string[] = [],
  objectsInThisPath: any[] = [],
  seenObjects = new Map<unknown, Result>(),
  samePathDepth: number = 0
): Result => {
  const primitive = isPrimitive(object);

  if (!primitive) {
    addIdentity(object, path, samePathDepth, identities);

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
    objectsInThisPath.push(object);
    const recursiveResult = walker(
      value,
      identities,
      superJson,
      dedupe,
      path,
      objectsInThisPath,
      seenObjects,
      samePathDepth + 1
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

    if (!primitive) seenObjects.set(object, result);
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
        0
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
