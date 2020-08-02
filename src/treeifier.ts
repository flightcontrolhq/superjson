import { isArray, isString } from './is';

export type Path = (string | number)[];
export interface TreeEntry {
  path: Path;
  value: string;
}

type TreeValueNode = [string, TreeInnerNode];

interface TreeInnerNode extends Record<string, string | Tree> {}

type Tree = TreeValueNode | TreeInnerNode;

export const treeify = (entries: TreeEntry[]): Tree => {
  let result: Tree = {};

  entries.forEach(entry => {
    const { path } = entry;
    if (path.length === 0) {
      result = [entry.value, result as TreeInnerNode];
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
        parent[segment] = [parent[segment] as string, {}];
      } else {
        parent = parent[segment] as TreeInnerNode;
      }
    }

    if (isArray(parent)) {
      const [, realParent] = parent;
      parent = realParent;
    }

    (parent as TreeInnerNode)[end] = entry.value;
  });

  return result;
};

export const detreeify = (tree: Tree): TreeEntry[] => {
  if (isArray(tree)) {
    const [value, children] = tree;

    const rootEntry: TreeEntry = {
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
      };
    }

    return detreeify(child).map(entry => ({
      path: [segment, ...entry.path],
      value: entry.value,
    }));
  });
};
