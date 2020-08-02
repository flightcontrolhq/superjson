import { isArray, isString } from './is';

export type Path = string[];
export interface TreeEntry<T extends string = string> {
  path: Path;
  value: T;
}

export type TreeValueNode<T extends string = string> = [T, TreeInnerNode<T>];

export interface TreeInnerNode<T extends string = string>
  extends Record<string, string | Tree<T>> {}

export type Tree<T extends string = string> =
  | TreeValueNode<T>
  | TreeInnerNode<T>;

export const treeify = <T extends string = string>(
  entries: TreeEntry<T>[]
): Tree<T> => {
  let result: Tree<T> = {};

  entries.forEach(entry => {
    const { path } = entry;
    if (path.length === 0) {
      result = [entry.value, result as TreeInnerNode<T>];
      return;
    }

    const front = path.slice(0, path.length - 1);
    const end = path[path.length - 1];

    let parent: Tree = result;
    for (const segment of front) {
      if (isArray(parent)) {
        const [, realParent] = parent;
        parent = realParent;
      }

      if (!parent.hasOwnProperty(segment)) {
        parent[segment] = {};
      }

      if (isString(parent[segment])) {
        const newNode: TreeValueNode<T> = [parent[segment] as T, {}];
        parent[segment] = newNode;
        parent = newNode;
      } else {
        parent = parent[segment] as TreeInnerNode<T>;
      }
    }

    if (isArray(parent)) {
      const [, realParent] = parent;
      parent = realParent;
    }

    (parent as TreeInnerNode<T>)[end] = entry.value;
  });

  return result;
};

export const detreeify = <T extends string = string>(
  tree: Tree<T>
): TreeEntry<T>[] => {
  if (isArray(tree)) {
    const [value, children] = tree;

    const rootEntry = {
      path: [],
      value,
    };
    const childrenEntries = detreeify(children);
    return [rootEntry, ...childrenEntries];
  }

  return Object.entries(tree).flatMap(([segment, child]) => {
    if (isString(child)) {
      return {
        path: [segment],
        value: child,
      } as TreeEntry<T>;
    }

    return detreeify(child).map(entry => ({
      path: [segment, ...entry.path],
      value: entry.value,
    }));
  });
};
