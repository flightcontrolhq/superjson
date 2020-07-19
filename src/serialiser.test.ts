import {
  flattenAndSerialise,
  entries,
  deserialiseFlattened,
  minimizeFlattened,
  setDeep,
  deepConvertArrayLikeObjects,
  FlattenAnnotations,
} from './serialiser';

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
  expect(setDeep(object, ['a', '1', 'b', '2'], 5)).toEqual({
    a: {
      1: {
        b: {
          2: 5,
        },
      },
    },
  });
});

test('deepConvertArrayLikeObjects', () => {
  const arrayLike = {
    0: 1,
    1: null,
    2: 3,
    3: { 0: { 1: 3, 2: 3 }, 1: { 0: 1 } },
  };
  expect(deepConvertArrayLikeObjects(arrayLike)).toEqual([
    1,
    null,
    3,
    [{ 1: 3, 2: 3 }, [1]],
  ]);
});

describe('flattenAndSerialise & deserialise', () => {
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
        'a.1': 5,
        'a.2.3': 'c',
        b: null,
      },
    },

    'special case: objects with array-like keys': {
      input: {
        a: { 0: 3, 1: 5, 2: { 3: 'c' } },
        b: null,
      },
      output: {
        'a.0': 3,
        'a.1': 5,
        'a.2.3': 'c',
        b: null,
      },
      outputAnnotations: {
        a: 'object',
      },
      unflattenedOutput: {
        a: { 0: 3, 1: 5, 2: { 3: 'c' } },
        b: null,
      },
    },

    'works for arrays': {
      input: {
        a: [1, undefined, 2],
      },
      output: {
        'a.0': 1,
        'a.2': 2,
      },
      outputAnnotations: {
        'a.1': 'undefined',
      },
    },

    'works for Sets': {
      input: {
        a: new Set([1, undefined, 2]),
      },
      output: {
        'a.0': 1,
        'a.2': 2,
      },
      outputAnnotations: {
        a: 'set',
        'a.1': 'undefined',
      },
    },

    'works for top-level Sets': {
      input: new Set([1, undefined, 2]),
      output: {
        '0': 1,
        '2': 2,
      },
      outputAnnotations: {
        '': 'set',
        '1': 'undefined',
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
        'a.1': 'a',
        'a.2': 'b',
      },

      outputAnnotations: {
        a: 'map',
      },
    },

    'works for paths containing dots': {
      input: {
        'a.1': {
          b: 3,
        },
      },
      output: {
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
        'a\\\\.1.b': 3,
      },
    },
  };

  for (const [
    testName,
    { input, output, unflattenedOutput, outputAnnotations },
  ] of Object.entries(cases)) {
    test(testName, () => {
      const { output: flattened, annotations } = JSON.parse(
        JSON.stringify(flattenAndSerialise(input))
      );
      expect(flattened).toEqual(output);
      expect(annotations).toEqual(outputAnnotations ?? {});
      const untransformed = deserialiseFlattened(flattened, annotations);
      expect(untransformed).toEqual(unflattenedOutput ?? input);
    });
  }

  describe('when given a self-referencing object', () => {
    it('throws', () => {
      const a = { role: 'parent', children: [] as any[] };
      const b = { role: 'child', parent: [a] };
      a.children.push(b);
      expect(() => {
        flattenAndSerialise(a);
      }).toThrow(TypeError);
    });
  });
});
