import { isArray } from './is';

export const mapDeep = (
  object: object,
  path: (string | number)[],
  mapper: (v: any) => any
): object => {
  if (path.length === 0) {
    return mapper(object);
  }

  const [head, ...tail] = path;

  if (isArray(object)) {
    return object.map((v, i) => {
      if (i === head) {
        return mapDeep(v, tail, mapper);
      }

      return v;
    });
  } else {
    return {
      ...object,
      [head]: mapDeep((object as any)[head], tail, mapper),
    };
  }
};
