export type StringifiedPath = string;
type Path = string[];

export const escapeKey = (key: string) =>
  key.replace(/\\/g, '\\\\').replace(/\./g, '\\.');

export const stringifyPath = (path: Path): StringifiedPath =>
  path
    .map(String)
    .map(escapeKey)
    .join('.');

export const parsePath = (string: StringifiedPath, legacyPaths: boolean) => {
  const result: string[] = [];

  let segment = '';
  for (let i = 0; i < string.length; i++) {
    let char = string.charAt(i);

    if (!legacyPaths) {
      const isEscapedBackslash = char === '\\' && string.charAt(i + 1) === '\\';
      if (isEscapedBackslash) {
        segment += '\\';
        i++;
        continue;
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

  const lastSegment = segment;
  result.push(lastSegment);

  return result;
};
