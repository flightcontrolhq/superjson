import { stringifyPath, parsePath } from './pathstringifier';
import { isUndefined } from './is';

function isPrefix<T>(to: T[], prefixCandidate: T[]) {
  return prefixCandidate.every((value, index) => {
    const isPresentInArr = to[index] === value;
    return isPresentInArr;
  });
}

export type Tree<T> = InnerNode<T> | Leaf<T>;
type Leaf<T> = [T];
type InnerNode<T> = [T, Record<string, Tree<T>>];

export module PathTree {
  export function create<T>(value: T): Tree<T> {
    return [value, {}];
  }

  export function get<T>(
    tree: Tree<T>,
    path: (string | number)[]
  ): [T, true] | [null, false] {
    if (path.length === 0) {
      return [tree[0] as T, true];
    }

    if (tree.length === 1) {
      return [null, false];
    } else {
      const [head, ...tail] = path;
      const [, children] = tree;
      return get(children[head], tail);
    }
  }

  /**
   * @description Optimised for adding new leaves. Does not support adding inner nodes.
   */
  export function append<T>(tree: Tree<T>, path: string[], value: T): Tree<T> {
    if (path.length === 0) {
      if (tree.length === 1) {
        return [value];
      } else {
        const [, children] = tree;
        return [value, children];
      }
    }

    if (tree.length === 1) {
      const [nodeValue] = tree;
      return [nodeValue, { [stringifyPath(path)]: [value] }];
    } else {
      const [nodeValue, children] = tree;
      const availablePaths = Object.keys(children);

      // due to the constraints mentioned in the functions description,
      // there may be prefixes of `path` already set, but no extensions of it.
      // If there's such a prefix, we'll find it.
      const prefix = availablePaths
        .map(parsePath)
        .find(candidate => isPrefix(path, candidate));

      if (isUndefined(prefix)) {
        return [nodeValue, { ...children, [stringifyPath(path)]: [value] }];
      } else {
        const pathWithoutPrefix = path.slice(prefix.length);
        const stringPrefix = stringifyPath(prefix);
        return [
          nodeValue,
          {
            ...children,
            [stringPrefix]: append(
              children[stringPrefix],
              pathWithoutPrefix,
              value
            ),
          },
        ];
      }
    }
  }

  /**
   * Depth-first traversal,
   * root is traversed before its children.
   */
  export function traverse<T>(
    tree: Tree<T>,
    walker: (v: T, path: string[]) => void,
    origin: string[] = []
  ): void {
    if (tree.length === 1) {
      const [nodeValue] = tree;
      walker(nodeValue, origin);
    } else {
      const [nodeValue, children] = tree;
      walker(nodeValue, origin);

      Object.entries(children).forEach(([key, children]) => {
        traverse(children, walker, [...origin, ...parsePath(key)]);
      });
    }
  }
}
