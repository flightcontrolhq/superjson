export type StringifiedPath = string;
type Path = (number | string)[];

export const escapeKey = (key: string) => key.replace(/\./g, '\\.');
export const unescapeKey = (k: string) => k.replace(/\\\./g, '.');

export const stringifyPath = (path: Path): StringifiedPath =>
  path
    .map(String)
    .map(escapeKey)
    .join('.');

export const parsePath = (string: StringifiedPath): Path =>
  string.split(/(?<!\\)\./g).map(unescapeKey);

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
