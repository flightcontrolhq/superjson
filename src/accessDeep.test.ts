import { setDeep, type AccessDeepContext } from './accessDeep.js';

import { describe, it, expect } from 'vitest';

describe('setDeep', () => {
  it('correctly sets values in maps', () => {
    const obj = {
      a: new Map([[new Set(['NaN']), [[1, 'undefined']]]]),
    };
    const context: AccessDeepContext = new WeakMap();

    setDeep(obj, ['a', 0, 0, 0], Number, context);
    setDeep(obj, ['a', 0, 1], entries => new Map(entries), context);
    setDeep(obj, ['a', 0, 1, 0, 1], () => undefined, context);

    expect(obj).toEqual({
      a: new Map([[new Set([NaN]), new Map([[1, undefined]])]]),
    });
  });

  it('correctly sets values in sets', () => {
    const obj = {
      a: new Set([10, new Set(['NaN'])]),
    };
    const context: AccessDeepContext = new WeakMap();

    setDeep(obj, ['a', 1, 0], Number, context);

    expect(obj).toEqual({
      a: new Set([10, new Set([NaN])]),
    });
  });
});
