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

  it('keeps set index cache in sync when values change', () => {
    const obj = { s: new Set([1, 2, 3]) };
    const context: AccessDeepContext = new WeakMap();

    setDeep(obj, ['s', 1], v => v * 10, context); // 2 -> 20 (appended)
    setDeep(obj, ['s', 1], v => v * 100, context); // 3 -> 300 (appended)

    expect(Array.from(obj.s)).toEqual([1, 20, 300]);

    const indexed = context.get(obj.s);
    expect(indexed).toBeDefined();
    // Verify cache is in sync by checking we can access all indices
    expect(() => indexed!.get(obj.s.size - 1)).not.toThrow();
    expect(() => indexed!.get(obj.s.size)).toThrow();
  });

  it('keeps set index cache in sync when mapper creates duplicates', () => {
    const obj = { s: new Set([1, 2, 3]) };
    const context: AccessDeepContext = new WeakMap();

    setDeep(obj, ['s', 0], () => 2, context); // 1 -> 2 (dedup, no append)
    setDeep(obj, ['s', 0], v => v * 10, context); // 2 -> 20 (appended)

    expect(Array.from(obj.s)).toEqual([3, 20]);

    const indexed = context.get(obj.s);
    expect(indexed).toBeDefined();
    // Verify cache is in sync by checking we can access all indices
    expect(() => indexed!.get(obj.s.size - 1)).not.toThrow();
    expect(() => indexed!.get(obj.s.size)).toThrow();
  });

  it('keeps map key index cache in sync when keys change', () => {
    const obj = { m: new Map([['a', 1], ['b', 2], ['c', 3]]) };
    const context: AccessDeepContext = new WeakMap();

    setDeep(obj, ['m', 1, 0], k => String(k).toUpperCase(), context); // b -> B (appended)
    setDeep(obj, ['m', 1, 1], v => v * 10, context); // row 1 is now c

    expect(Array.from(obj.m.entries())).toEqual([['a', 1], ['c', 30], ['B', 2]]);

    const indexed = context.get(obj.m);
    expect(indexed).toBeDefined();
    expect(() => indexed!.get(obj.m.size - 1)).not.toThrow();
    expect(() => indexed!.get(obj.m.size)).toThrow();
  });
});
