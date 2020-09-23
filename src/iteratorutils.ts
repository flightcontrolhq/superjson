export const forEach = <T>(iterator: Iterator<T>, func: (v: T) => void) => {
  while (true) {
    const { done, value } = iterator.next();
    if (done) {
      return;
    }

    func(value);
  }
};

export const map = <A, B>(
  iterator: Iterator<A>,
  map: (v: A, index: number) => B
): B[] => {
  const result: B[] = [];

  forEach(iterator, value => {
    result.push(map(value, result.length));
  });

  return result;
};

export function toIterator<T>(arr: T[]): Iterator<T> {
  let i = 0;
  return {
    next() {
      const value = arr[i];
      i++;
      const done = i === arr.length;
      return { value, done };
    },
  };
}
