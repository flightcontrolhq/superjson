type MaybeNode<T> = AvlNode<T> | null;

class AvlNode<T> {
  value: T;
  left: MaybeNode<T> = null;
  right: MaybeNode<T> = null;
  height: number = 1;
  size: number = 1;

  constructor(value: T) {
    this.value = value;
  }
}

function getHeight<T>(n: MaybeNode<T>): number {
  return n ? n.height : 0;
}

function getSize<T>(n: MaybeNode<T>): number {
  return n ? n.size : 0;
}

function updateNode<T>(n: AvlNode<T>): void {
  const leftHeight = getHeight(n.left);
  const rightHeight = getHeight(n.right);
  n.height = (leftHeight > rightHeight ? leftHeight : rightHeight) + 1;
  n.size = 1 + getSize(n.left) + getSize(n.right);
}

function rotateRight<T>(y: AvlNode<T>): AvlNode<T> {
  const x = y.left!;
  const t2 = x.right;

  x.right = y;
  y.left = t2;

  updateNode(y);
  updateNode(x);
  return x;
}

function rotateLeft<T>(x: AvlNode<T>): AvlNode<T> {
  const y = x.right!;
  const t2 = y.left;

  y.left = x;
  x.right = t2;

  updateNode(x);
  updateNode(y);
  return y;
}

function rebalance<T>(n: AvlNode<T>): AvlNode<T> {
  updateNode(n);
  const balanceFactor = getHeight(n.left) - getHeight(n.right);

  if (balanceFactor > 1) {
    const l = n.left!;
    if (getHeight(l.left) < getHeight(l.right)) n.left = rotateLeft(l);
    return rotateRight(n);
  }

  if (balanceFactor < -1) {
    const r = n.right!;
    if (getHeight(r.right) < getHeight(r.left)) n.right = rotateRight(r);
    return rotateLeft(n);
  }

  return n;
}

function extractMin<T>(n: AvlNode<T>): [MaybeNode<T>, AvlNode<T>] {
  if (!n.left) {
    const right = n.right;
    n.right = null;
    updateNode(n);
    return [right, n];
  }
  const [newLeft, minNode] = extractMin(n.left);
  n.left = newLeft;
  return [rebalance(n), minNode];
}

function insertAt<T>(n: MaybeNode<T>, index: number, value: T): AvlNode<T> {
  if (!n) return new AvlNode(value);

  const leftSize = getSize(n.left);
  if (index <= leftSize) {
    n.left = insertAt(n.left, index, value);
  } else {
    n.right = insertAt(n.right, index - leftSize - 1, value);
  }
  return rebalance(n);
}

function deleteAt<T>(n: AvlNode<T>, index: number): [MaybeNode<T>, T] {
  const leftSize = getSize(n.left);

  if (index < leftSize) {
    const [newLeft, deleted] = deleteAt(n.left!, index);
    n.left = newLeft;
    return [rebalance(n), deleted];
  }

  if (index > leftSize) {
    const [newRight, deleted] = deleteAt(n.right!, index - leftSize - 1);
    n.right = newRight;
    return [rebalance(n), deleted];
  }

  // delete this node
  const deletedValue = n.value;

  if (!n.left) return [n.right, deletedValue];
  if (!n.right) return [n.left, deletedValue];

  const [newRight, successor] = extractMin(n.right);
  successor.left = n.left;
  successor.right = newRight;
  return [rebalance(successor), deletedValue];
}

function nodeAt<T>(root: MaybeNode<T>, index: number): AvlNode<T> {
  let cur = root;
  let i = index;
  while (cur) {
    const leftSize = getSize(cur.left);
    if (i < leftSize) {
      cur = cur.left;
    } else if (i === leftSize) {
      return cur;
    } else {
      i -= leftSize + 1;
      cur = cur.right;
    }
  }
  throw new RangeError(`index ${index} out of range`);
}

function buildBalancedFromArray<T>(arr: readonly T[], lo: number, hi: number): MaybeNode<T> {
  if (lo >= hi) return null;
  const mid = lo + ((hi - lo) >>> 1);
  const n = new AvlNode(arr[mid]);
  n.left = buildBalancedFromArray(arr, lo, mid);
  n.right = buildBalancedFromArray(arr, mid + 1, hi);
  updateNode(n);
  return n;
}

function assertIndex(index: number, size: number): void {
  if (!Number.isSafeInteger(index)) {
    throw new TypeError(`index must be a safe integer, got ${index}`);
  }
  if (index < 0 || index >= size) {
    throw new RangeError(`index ${index} out of range`);
  }
}

export class IndexedListAVL<T> {
  private root: MaybeNode<T> = null;

  constructor(init: Iterable<T> | null = null) {
    if (init) {
      const arr = Array.from(init);
      this.root = buildBalancedFromArray(arr, 0, arr.length);
    }
  }

  get(index: number): T {
    assertIndex(index, getSize(this.root));
    return nodeAt(this.root, index).value;
  }

  delete(index: number): T {
    assertIndex(index, getSize(this.root));
    const [newRoot, deleted] = deleteAt(this.root!, index);
    this.root = newRoot;
    return deleted;
  }

  insertAtEnd(value: T): void {
    this.root = insertAt(this.root, getSize(this.root), value);
  }
}
