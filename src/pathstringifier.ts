type Path = (number | string)[];

const escape = (key: string) => key.replace(/\./g, '\\.');
const unescape = (k: string) => k.replace(/\\\./g, '.');

export const stringifyPath = (path: Path): string =>
  path
    .map(String)
    .map(escape)
    .join('.');

export const parsePath = (string: string): Path =>
  string.split(/(?<!\\)\./g).map(unescape);
