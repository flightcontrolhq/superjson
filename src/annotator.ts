import { Walker } from './plainer';
import { transformValue } from './transformer';

const escapeKey = (key: string) => key.replace(/\./g, '\\.');

export const makeAnnotator = () => {
  const annotations: any = {};

  const annotator: Walker = ({ path, node }) => {
    const transformed = transformValue(node);

    if (transformed) {
      annotations[
        path
          .map(String)
          .map(escapeKey)
          .join('.')
      ] = transformed.type;
      return transformed.value;
    } else {
      return node;
    }
  };

  return { annotations, annotator };
};
