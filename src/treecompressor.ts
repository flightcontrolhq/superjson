import {
  Tree,
  TreeInnerNodeWithoutValue,
  TreeInnerNodeWithValue,
} from './treeifier';
import { isArray } from './is';
import { escapeKey, parsePath } from './pathstringifier';

export const compress = <T>(tree: Tree<T>): Tree<T> => {
  const isLeaf = isArray(tree) && tree.length === 1;
  if (isLeaf) {
    return tree;
  }

  const isInnerNodeWithValue = isArray(tree) && tree.length === 2;
  if (isInnerNodeWithValue) {
    const [value, children] = tree as TreeInnerNodeWithValue<T>;
    return [value, compress(children) as TreeInnerNodeWithoutValue<T>];
  }

  return Object.fromEntries(
    Object.entries(tree as TreeInnerNodeWithoutValue<T>).map(
      ([edge, child]) => {
        const childHasValue = isArray(child);
        if (childHasValue) {
          return [edge, child];
        }

        child = Object.fromEntries(
          Object.entries(child).map(([key, value]) => [escapeKey(key), value])
        );
        child = compress(child) as TreeInnerNodeWithoutValue<T>;

        const keysOfChild = Object.keys(child);
        const hasMultipleKeys = keysOfChild.length > 1;
        if (hasMultipleKeys) {
          return [edge, child];
        }

        const [singleChildKey] = keysOfChild;
        let singleChildValue = child[singleChildKey];

        return [`${escapeKey(edge)}.${singleChildKey}`, singleChildValue];
      }
    )
  );
};

export const uncompress = <T>(tree: Tree<T>): Tree<T> => {
  const isLeaf = isArray(tree) && tree.length === 1;
  if (isLeaf) {
    return tree;
  }

  const isInnerNodeWithValue = isArray(tree) && tree.length === 2;
  if (isInnerNodeWithValue) {
    const [value, children] = tree as TreeInnerNodeWithValue<T>;
    return [value, uncompress(children) as TreeInnerNodeWithoutValue<T>];
  }

  return Object.fromEntries(
    Object.entries(tree).map(([segment, child]) => {
      const path = parsePath(segment);
      if (path.length === 1) {
        return [segment, child];
      }

      const firstKey = path[0];
      const innerKeys = path.slice(1, path.length - 1);
      const lastKey = path[path.length - 1];

      const newChild: TreeInnerNodeWithoutValue<T> = {};
      let lastNode = newChild;
      for (const key of innerKeys) {
        const newNode = {};
        lastNode[key] = newNode;
        lastNode = newNode;
      }

      lastNode[lastKey] = child;

      return [firstKey, newChild];
    })
  );
};
