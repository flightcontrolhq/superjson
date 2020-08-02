import { Tree, TreeInnerNode } from './treeifier';
import { isArray, isString, isPlainObject } from './is';
import { escapeKey, parsePath } from './pathstringifier';

export const compress = <T extends string = string>(tree: Tree<T>): Tree<T> => {
  if (isArray(tree)) {
    return tree;
  }

  return Object.fromEntries(
    Object.entries(tree).map(([segment, child]) => {
      if (isString(child) || isArray(child)) {
        return [segment, child];
      }

      if (isPlainObject(child)) {
        child = Object.fromEntries(
          Object.entries(child).map(([key, value]) => [escapeKey(key), value])
        );
        child = compress(child) as TreeInnerNode<T>;
      }

      const keysOfChild = Object.keys(child);
      const hasMultipleKeys = keysOfChild.length > 1;
      if (hasMultipleKeys) {
        return [segment, child];
      }

      const [singleChildKey] = keysOfChild;
      let singleChildValue = child[singleChildKey];

      return [`${escapeKey(segment)}.${singleChildKey}`, singleChildValue];
    })
  );
};

export const uncompress = <T extends string = string>(
  tree: Tree<T>
): Tree<T> => {
  if (isArray(tree)) {
    return tree;
  }

  return Object.fromEntries(
    Object.entries(tree).map(([segment, child]) => {
      if (!isString(child)) {
        return [segment, child];
      }

      const path = parsePath(segment);
      if (path.length === 1) {
        return [segment, child];
      }

      const firstKey = path[0];
      const innerKeys = path.slice(1, path.length - 1);
      const lastKey = path[path.length - 1];

      const newChild: TreeInnerNode = {};
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
