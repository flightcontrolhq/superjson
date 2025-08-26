export function find<T>(
  record: Record<string, T>,
  predicate: (v: T) => boolean
): T | undefined {
  return Object.values(record).find(predicate);
}

export function forEach<T>(
  record: Record<string, T>,
  run: (v: T, key: string) => void
) {
  Object.entries(record).forEach(([key, value]) => run(value, key));
}

export function includes<T>(arr: T[], value: T) {
  return arr.includes(value);
}

export function findArr<T>(
  record: T[],
  predicate: (v: T) => boolean
): T | undefined {
  return record.find(predicate);
}
