import is from '@sindresorhus/is';

const mapKey = (
  object: object,
  key: string | number,
  mapper: (v: any) => any
) => {
  if (is.array(object)) {
    return object.map((v, i) => {
      if (i === key) {
        return mapper(v);
      }

      return v;
    });
  } else {
    return {
      ...object,
      [key]: mapper((object as any)[key]),
    };
  }
};

export const mapDeep = (
  object: object,
  path: string[],
  mapper: (v: any) => any
): object => {
  if (path.length < 1) {
    throw new Error('Illegal Argument');
  }

  const [head, ...tail] = path;

  if (path.length === 1) {
    return mapKey(object, head, mapper);
  }

  return mapKey(object, head, v => mapDeep(v ?? {}, tail, mapper));
};
