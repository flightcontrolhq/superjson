import { flattenAndSerialise, deserialiseFlattened } from './serialiser';
import { unflatten, flatten } from './flattener';

export function serialise(value: any): string {
  const { output, annotations } = flattenAndSerialise(value);
  const v = unflatten(output);
  const meta = unflatten(annotations);
  return JSON.stringify({ value: v, meta });
}

export function deserialise(string: string): any {
  const { value, meta } = JSON.parse(string);
  const input = flatten(value);
  const annotations = flatten(meta);
  return deserialiseFlattened(input, annotations);
}
