import { Walker } from './plainer';
import { transformValue } from './transformer';
import { FlattenAnnotations } from 'serializer';

const escapeKey = (key: string) => key.replace(/\./g, '\\.');

const pathToKey = (path: (string | number)[]): string =>
  path
    .map(String)
    .map(escapeKey)
    .join('.');
export const makeAnnotator = () => {
  const annotations: FlattenAnnotations = {};

  const annotator: Walker = ({ path, node }) => {
    const transformed = transformValue(node);

    if (transformed) {
      if (path.length === 0) {
        annotations.root = transformed.type;
      } else {
        if (!annotations.values) {
          annotations.values = {};
        }

        annotations.values[pathToKey(path)] = transformed.type;
      }
      return transformed.value;
    } else {
      return node;
    }
  };

  return { annotations, annotator };
};
