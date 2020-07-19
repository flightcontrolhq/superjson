import { areKeysArrayLike } from './transformer';

test('areKeysArrayLike', () => {
  expect(areKeysArrayLike(['0', '1', '2'])).toBe(true);

  expect(areKeysArrayLike(['1', '2'])).toBe(false);

  expect(areKeysArrayLike(['0', 'a', '2'])).toBe(false);
});
