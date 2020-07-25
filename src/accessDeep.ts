export const getDeep = (object: object, path: (string | number)[]): object => {
  for (const key of path) {
    object = (object as any)[key];
  }

  return object;
};

export const setDeep = (
  object: object,
  path: (string | number)[],
  mapper: (v: any) => any
): object => {
  if (path.length === 0) {
    return mapper(object);
  }

  const front = path.slice(0, path.length - 1);
  const last = path[path.length - 1];

  const parent: any = getDeep(object, front);

  parent[last] = mapper(parent[last]);

  return object;
};
