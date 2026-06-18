export type StringifiedPath = string;
type Path = string[];

export const escapeKey = (key: string) => {
  key = key.replace(/\\/g, '\\\\');
  if (key[0] === '$') key = '\\' + key;
  return key.replace(/\./g, '\\.');
};

export const stringifyPath = (path: Path): StringifiedPath =>
  path
    .map(String)
    .map(escapeKey)
    .join('.');

export const parsePath = (
  string: StringifiedPath,
  legacyPaths: boolean,
  depthSegment: boolean
) => {
  const result: string[] = [];

  let segment = '';
  for (let i = 0; i < string.length; i++) {
    let char = string.charAt(i);

    if (!legacyPaths && char === '\\') {
      const escaped = string.charAt(i + 1);
      if (escaped === '\\') {
        segment += '\\';
        i++;
        continue;
      } else if (escaped !== '.' && escaped !== '$') {
        throw Error('invalid path');
      }
    }

    const isEscapedDot = char === '\\' && string.charAt(i + 1) === '.';
    if (isEscapedDot) {
      segment += '.';
      i++;
      continue;
    }

    const isEndOfSegment = char === '.';
    if (isEndOfSegment) {
      result.push(segment);
      segment = '';
      continue;
    }

    segment += char;
  }

  let lastSegment = segment;
  if (!depthSegment || lastSegment[0] !== '$') {
    result.push(segment.slice(0, 2) === '\\$' ? segment.slice(1) : segment);
  }

  return result;
};
