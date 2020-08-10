import { escapeKey } from './pathstringifier';

describe('escapeKey', () => {
  test.each([
    ['dontescape', 'dontescape'],
    ['escape.me', 'escape\\.me'],
  ])('escapeKey(%s) === %s', (input, expectedOutput) => {
    expect(escapeKey(input)).toEqual(expectedOutput);
  });
});
