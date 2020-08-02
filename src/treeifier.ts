import { isArray, isPlainObject } from './is';

export type Path = string[];
export interface TreeEntry<T> {
  path: Path;
  value: T;
}

export type TreeLeaf<T> = [T];

export type TreeInnerNodeWithValue<T> = [T, TreeInnerNodeWithoutValue<T>];

export interface TreeInnerNodeWithoutValue<T> extends Record<string, Tree<T>> {}

export type Tree<T> =
  | TreeLeaf<T>
  | TreeInnerNodeWithoutValue<T>
  | TreeInnerNodeWithValue<T>;

export const isTree = <T = any>(
  v: any,
  valueChecker: (v: T) => boolean = () => true
): v is Tree<T> => {
  try {
    if (isArray(v)) {
      if (v.length === 1) {
        return valueChecker(v[0]);
      } else if (v.length === 2) {
        return valueChecker(v[0]) && isTree(v[1], valueChecker);
      } else {
        return false;
      }
    }

    if (isPlainObject(v)) {
      return Object.values(v).every(v => isTree(v, valueChecker));
    }

    return true;
  } catch (error) {
    return false;
  }
};

export const treeify = <T>(entries: TreeEntry<T>[]): Tree<T> => {
  let result: Tree<T> = {};

  for (const entry of entries) {
    const { path } = entry;
    if (path.length === 0) {
      const resultIsEmpty = Object.keys(result).length === 0;
      if (resultIsEmpty) {
        result = [entry.value];
      } else {
        result = [entry.value, result as TreeInnerNodeWithoutValue<T>];
      }

      continue;
    }

    const front = path.slice(0, path.length - 1);
    const end = path[path.length - 1];

    let parent: Tree<T> = result;
    for (const segment of front) {
      const isValueNode = isArray(parent);
      const hasChild = isValueNode && parent.length > 1;
      if (hasChild) {
        const [, realParent] = parent as TreeInnerNodeWithValue<T>;
        parent = realParent;
      }

      parent = parent as TreeInnerNodeWithoutValue<T>;

      if (!parent.hasOwnProperty(segment)) {
        parent[segment] = {};
      }

      const childIsValueNode = isArray(parent[segment]);

      if (childIsValueNode) {
        const leaf = parent[segment] as TreeLeaf<T>;
        const [leafValue] = leaf;
        const newNode: TreeInnerNodeWithValue<T> = [leafValue, {}];
        parent[segment] = newNode;
        parent = newNode;
      } else {
        parent = parent[segment];
      }
    }

    if (isArray(parent)) {
      const type = parent.length === 1 ? 'leaf' : 'inner_node';
      if (type === 'leaf') {
        parent[1] = {
          [end]: [entry.value],
        };
      }
      if (type === 'inner_node') {
        parent[1]![end] = [entry.value];
      }
    } else {
      parent[end] = [entry.value];
    }
  }

  return result;
};

export const detreeify = <T>(tree: Tree<T>): TreeEntry<T>[] => {
  if (isArray(tree)) {
    const [value, children = {}] = tree;

    return [
      {
        path: [],
        value,
      },
      ...detreeify(children),
    ];
  }

  return Object.entries(tree).flatMap(([segment, child]) => {
    return detreeify(child).map(entry => ({
      path: [segment, ...entry.path],
      value: entry.value,
    }));
  });
};

export const treeifyPaths = (paths: Path[]): Tree<string> => {
  return treeify(
    paths.map(path => {
      const front = path.slice(0, path.length - 1);
      const lastSegment = path[path.length - 1];
      return {
        path: front,
        value: '' + lastSegment,
      };
    })
  );
};

export const detreeifyPaths = (tree: Tree<string>): Path[] => {
  return detreeify(tree).map(treeEntry => {
    const { path: front, value: lastSegment } = treeEntry;
    return [...front, '' + lastSegment];
  });
};
