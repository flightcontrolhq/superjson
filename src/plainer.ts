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

function stringifyPathWithDepth(path: string[], depth: number) {
  if (!depth) return stringifyPath(path);
  return stringifyPath(path) + '.$' + depth;
}

function traverse<T>(
  tree: MinimisedTree<T>,
  walker: (
    type: any,
    path: string[],
    equalityGroup: ReferentialEqualityGroup | undefined
  ) => void,
  equalityGroupsByPath: Map<string, ReferentialEqualityGroup>,
  version: number,
  origin: string[] = [],
  samePathDepth: number = 0
): void {
  if (!tree) {
    return;
  }

  const equalityGroup = equalityGroupsByPath.get(
    stringifyPathWithDepth(origin, samePathDepth)
  );

  if (equalityGroup) {
    if (equalityGroup.resolved) return;
    equalityGroup.resolved = true;
  }

  if (!isArray(tree)) {
    // Map to store each path and resolved state when looping forEach
    const seenPathsResolvedState = new Map<string, boolean>();

    forEach(tree, (subtree, key) => {
      const parsedKey = parsePath(
        key,
        enableLegacyPaths(version),
        enableDepthSegment(version)
      );

      const childPath = [...origin];

      for (let i = 0; i < parsedKey.length - 1; i++) {
        childPath.push(parsedKey[i]);
        const path = stringifyPathWithDepth(childPath, 0);

        let resolved;

        if ((resolved = seenPathsResolvedState.get(path)) !== undefined) {
          if (resolved) return;
          continue;
        }

        const equalityGroup = equalityGroupsByPath.get(path);
        if (equalityGroup) {
          resolved = equalityGroup.resolved;
          equalityGroup.resolved = true;
          seenPathsResolvedState.set(path, resolved);
          if (resolved) return;
        }
      }

      childPath.push(parsedKey[parsedKey.length - 1]);

      traverse(subtree, walker, equalityGroupsByPath, version, childPath, 0);
    });

    return;
  }

  const [nodeValue, children] = tree;
  if (children) {
    traverse(
      children,
      walker,
      equalityGroupsByPath,
      version,
      origin,
      samePathDepth + 1
    );
  }

  walker(nodeValue, origin, equalityGroup);
}

export type MetaObject = {
  values?: MinimisedTree<TypeAnnotation>;
  referentialEqualities?: ReferentialEqualityAnnotations;
  v?: number;
};

export function applyMeta(
  json: any,
  meta: MetaObject,
  superJson: SuperJSON
): any {
  //
  // Parsing and function declarations
  //
  const version = meta.v ?? 0;

  const {
    rootEqualities,
    equalityGroupsByPath,
    representativePaths,
  } = parseReferentialEqualities(meta.referentialEqualities, version);

  const setReferentialEquality = (
    representativePath: string[],
    identicalPaths: string[][]
  ) => {
    const object = getDeep(json, representativePath);
    for (const p of identicalPaths) json = setDeep(json, p, () => object);
  };

  const setValueAnnotations = (
    type: any,
    path: string[],
    equalityGroup: ReferentialEqualityGroup | undefined
  ) => {
    json = setDeep(json, path, v => untransformValue(v, type, superJson));
    if (equalityGroup) {
      setReferentialEquality(path, [...equalityGroup.duplicates]);
    }
  };

  //
  // Applying referential equalities and value annotations
  //

  for (const path of representativePaths) {
    const equalityGroup = equalityGroupsByPath.get(path)!;
    setReferentialEquality(
      equalityGroup.representative,
      equalityGroup.duplicates
    );
  }

  traverse(meta.values, setValueAnnotations, equalityGroupsByPath, version);

  for (const p of rootEqualities) {
    json = setDeep(json, p, () => json);
  }

  return json;
}

type ReferentialEqualityGroup = {
  representative: string[];
  duplicates: string[][];
  resolved: boolean;
};

function parseReferentialEqualities(
  referentialEqualities: ReferentialEqualityAnnotations | undefined,
  version: number
) {
  const legacyPaths = enableLegacyPaths(version);
  const depthSegment = enableDepthSegment(version);

  let rootEqualityPaths: string[] | undefined;
  let nonRootGroups: Record<string, string[]> | undefined;
  if (isArray(referentialEqualities)) {
    const [root, nonRoot] = referentialEqualities;
    rootEqualityPaths = root;
    nonRootGroups = nonRoot;
  } else {
    nonRootGroups = referentialEqualities;
  }

  const rootEqualities =
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

  return { rootEqualities, equalityGroupsByPath, representativePaths };
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
      paths = paths.sort((a, b) => a[1] - b[1] || a[0].length - b[0].length);
    }

    const [representativePath, ...identicalPaths] = paths;

    if (representativePath[0].length === 0) {
      rootEqualityPaths = identicalPaths.map(([path, depth]) =>
        stringifyPathWithDepth(path, depth)
      );
    } else {
      result[
        stringifyPathWithDepth(representativePath[0], representativePath[1])
      ] = identicalPaths.map(([path, depth]) =>
        stringifyPathWithDepth(path, depth)
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
