export function forEach<T>(iterator: Iterator<T>, func: (v: T) => void) {
    while (true) {
      const { done, value } = iterator.next()
      if (done) {
        return;
      }

      func(value);
    }
}

export function map<A, B>(iterator: Iterator<A>, map: (v: A, index: number) => B): B[] {
    const result: B[] = [];

    forEach(iterator, value => {
        result.push(map(value, result.length))
    })

    return result;
}