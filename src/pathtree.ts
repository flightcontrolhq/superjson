import { parsePath } from './pathstringifier';
import { isArray } from './is';
import { forEach } from './util';

export type Tree<T> = InnerNode<T> | Leaf<T>;
type Leaf<T> = [T];
type InnerNode<T> = [T, Record<string, Tree<T>>];

export type CollapsedRootTree<T> =
  | Tree<T>
  | Record<string, Tree<T>>
  | undefined;

export function traversePathTree<T>(
  tree: CollapsedRootTree<T>,
  walker: (v: T, path: string[]) => void,
  origin: string[] = []
): void {
  if (!tree) {
    return;
  }

  if (!isArray(tree)) {
    forEach(tree, (subtree, key) =>
      traversePathTree(subtree, walker, [...origin, ...parsePath(key)])
    );
    return;
  }

  if (tree.length === 1) {
    const [nodeValue] = tree;
    walker(nodeValue, origin);
  } else {
    const [nodeValue, children] = tree;

    forEach(children, (child, key) => {
      traversePathTree(child, walker, [...origin, ...parsePath(key)]);
    });

    walker(nodeValue, origin);
  }
}
