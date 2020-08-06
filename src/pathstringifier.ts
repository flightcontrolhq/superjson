export type StringifiedPath = string;
type Path = (number | string)[];

const escape = (key: string) => key.replace(/\./g, '\\.');

export const stringifyPath = (path: Path): StringifiedPath =>
  path
    .map(String)
    .map(escape)
    .join('.');

export const parsePath = (string: StringifiedPath) => {
  const result: string[] = [];

  let segment = '';
  for (let i = 0; i < string.length; i++) {
    let char = string.charAt(i);

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

export const isStringifiedPath = (
  string: string
): string is StringifiedPath => {
  try {
    parsePath(string);
    return true;
  } catch (anyError) {
    return false;
  }
};
