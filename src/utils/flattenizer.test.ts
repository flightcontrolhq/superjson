import {
  flatten,
  entries,
  unflatten,
  minimizeFlattened,
  setDeep,
  deepConvertArrayLikeObjects,
  areKeysArrayLike,
  FlattenAnnotations,
} from './flattenizer';

describe('entries', () => {
  it('works for arrays', () => {
    expect(entries(['a', 'b', 'c'])).toEqual([
      [0, 'a'],
      [1, 'b'],
      [2, 'c'],
    ]);
  });

  it('works for objects', () => {
    expect(entries({ 0: 'a', 1: 'b', 2: 'c' })).toEqual([
      ['0', 'a'],
      ['1', 'b'],
      ['2', 'c'],
    ]);
  });

  it('works for sets', () => {
    expect(entries(new Set(['a', 'b', 'c']))).toEqual([
      [0, 'a'],
      [1, 'b'],
      [2, 'c'],
    ]);
  });

  it('works for maps', () => {
    expect(
      entries(
        new Map<any, any>([
          ['0', 'a'],
          [1, 'b'],
          [undefined, 'c'],
        ])
      )
    ).toEqual([
      ['0', 'a'],
      [1, 'b'],
      [undefined, 'c'],
    ]);
  });
});

test('minimizeFlattened', () => {
  expect(
    minimizeFlattened({
      a: { 1: 5, 2: { 3: 'c' } },
      'a.1': 5,
      'a.2': { 3: 'c' },
      'a.2.3': 'c',
      b: null,
    })
  ).toEqual({
    'a.1': 5,
    'a.2.3': 'c',
    b: null,
  });
});

test('setDeep', () => {
  const object = { a: {} };
  setDeep(object, ['a', '1', 'b', '2'], 5);
  expect(object).toEqual({
    a: {
      1: {
        b: {
          2: 5,
        },
      },
    },
  });
});

test('areKeysArrayLike', () => {
  expect(areKeysArrayLike(['0', '1', '2'])).toBe(true);

  expect(areKeysArrayLike(['1', '2'])).toBe(false);

  expect(areKeysArrayLike(['0', 'a', '2'])).toBe(false);
});

test('deepConvertArrayLikeObjects', () => {
  const arrayLike = { 0: 1, 1: 2, 2: 3, 3: { 0: { 1: 3, 2: 3 }, 1: { 0: 1 } } };
  expect(deepConvertArrayLikeObjects(arrayLike)).toEqual([
    1,
    2,
    3,
    [{ 1: 3, 2: 3 }, [1]],
  ]);
});

describe('flatten & unflatten', () => {
  const cases: Record<
    string,
    {
      input: any;
      output: any;
      unflattenedOutput?: any;
      outputAnnotations?: FlattenAnnotations;
    }
  > = {
    'works for objects': {
      input: {
        a: { 1: 5, 2: { 3: 'c' } },
        b: null,
      },
      output: {
        a: { 1: 5, 2: { 3: 'c' } },
        'a.1': 5,
        'a.2': { 3: 'c' },
        'a.2.3': 'c',
        b: null,
      },
    },

    'special case: does not work for objects with array-like keys': {
      input: {
        a: { 0: 3, 1: 5, 2: { 3: 'c' } },
        b: null,
      },
      output: {
        a: { 0: 3, 1: 5, 2: { 3: 'c' } },
        'a.0': 3,
        'a.1': 5,
        'a.2': { 3: 'c' },
        'a.2.3': 'c',
        b: null,
      },
      outputAnnotations: {
        a: 'is_object',
      },
      unflattenedOutput: {
        a: [3, 5, { 3: 'c' }],
        b: null,
      },
    },

    'works for arrays': {
      input: {
        a: [1, 2, undefined],
      },
      output: {
        a: [1, 2, undefined],
        'a.0': 1,
        'a.1': 2,
        'a.2': undefined,
      },
    },

    'works for Sets': {
      input: {
        a: new Set([1, 2, undefined]),
      },
      output: {
        a: new Set([1, 2, undefined]),
        'a.0': 1,
        'a.1': 2,
        'a.2': undefined,
      },
      unflattenedOutput: {
        a: [1, 2, undefined],
      },
    },

    'works for Maps': {
      input: {
        a: new Map([
          [1, 'a'],
          [2, 'b'],
        ]),
      },

      output: {
        a: new Map([
          [1, 'a'],
          [2, 'b'],
        ]),
        'a.1': 'a',
        'a.2': 'b',
      },

      unflattenedOutput: {
        a: { 1: 'a', 2: 'b' },
      },
    },

    'works for paths containing dots': {
      input: {
        'a.1': {
          b: 3,
        },
      },
      output: {
        'a\\.1': { b: 3 },
        'a\\.1.b': 3,
      },
    },

    'works for paths containing backslashes': {
      input: {
        'a\\.1': {
          b: 3,
        },
      },
      output: {
        'a\\\\.1': { b: 3 },
        'a\\\\.1.b': 3,
      },
    },
  };

  for (const [
    testName,
    { input, output, unflattenedOutput, outputAnnotations },
  ] of Object.entries(cases)) {
    test(testName, () => {
      const { output: transformed, annotations } = flatten(input);
      expect(transformed).toEqual(output);
      expect(annotations).toEqual(outputAnnotations ?? {});
      const minimized = minimizeFlattened(transformed);
      const untransformed = unflatten(minimized);
      expect(untransformed).toEqual(unflattenedOutput ?? input);
    });
  }

  describe('when given a self-referencing object', () => {
    it('throws', () => {
      const a = { role: 'parent', children: [] as any[] };
      const b = { role: 'child', parent: [a] };
      a.children.push(b);
      expect(() => {
        flatten(a);
      }).toThrow(TypeError);
    });
  });
});
