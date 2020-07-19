import { flatten, unflatten } from './flattener';
import { deserializeFlattened, flattenAndSerialize } from './serializer';

export const serialize = (value: any): string => {
  const { output, annotations } = flattenAndSerialize(value);
  const v = unflatten(output);
  const meta = unflatten(annotations);

  return JSON.stringify({ value: v, meta });
};

export const deserialize = (string: string): any => {
  const { value, meta } = JSON.parse(string);
  const input = flatten(value);
  const annotations = flatten(meta);

  return deserializeFlattened(input, annotations);
};
