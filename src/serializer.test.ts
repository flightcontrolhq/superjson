import { serialize, Annotations } from './serializer';
import { applyAnnotations } from './annotator';

describe('flattenAndSerialize & deserialize', () => {
  const cases: Record<
    string,
    {
      input: any;
      output: any;
      unflattenedOutput?: any;
      outputAnnotations?: Annotations;
    }
  > = {
    'works for objects': {
      input: {
        a: { 1: 5, 2: { 3: 'c' } },
        b: null,
      },
      output: {
        a: { 1: 5, 2: { 3: 'c' } },
        b: null,
      },
    },

    'special case: objects with array-like keys': {
      input: {
        a: { 0: 3, 1: 5, 2: { 3: 'c' } },
        b: null,
      },
      output: {
        a: { 0: 3, 1: 5, 2: { 3: 'c' } },
        b: null,
      },
    },

    'works for arrays': {
      input: {
        a: [1, undefined, 2],
      },
      output: {
        a: [1, undefined, 2],
      },
      outputAnnotations: {
        values: {
          'a.1': 'undefined',
        },
      },
    },

    'works for Sets': {
      input: {
        a: new Set([1, undefined, 2]),
      },
      output: {
        a: [1, undefined, 2],
      },
      outputAnnotations: {
        values: {
          a: 'set',
          'a.1': 'undefined',
        },
      },
    },

    'works for top-level Sets': {
      input: new Set([1, undefined, 2]),
      output: [1, undefined, 2],
      outputAnnotations: {
        root: 'set',
        values: {
          '1': 'undefined',
        },
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
        a: {
          1: 'a',
          2: 'b',
        },
      },

      outputAnnotations: {
        values: {
          a: 'map',
        },
      },
    },

    'works for paths containing dots': {
      input: {
        'a.1': {
          b: 3,
        },
      },
      output: {
        'a.1': {
          b: 3,
        },
      },
    },

    'works for paths containing backslashes': {
      input: {
        'a\\.1': {
          b: 3,
        },
      },
      output: {
        'a\\.1': {
          b: 3,
        },
      },
    },
  };

  for (const [
    testName,
    { input, output, unflattenedOutput, outputAnnotations },
  ] of Object.entries(cases)) {
    test(testName, () => {
      const { output: flattened, annotations } = serialize(input);
      expect(annotations).toEqual(outputAnnotations ?? {});
      expect(flattened).toEqual(output);

      const untransformed = applyAnnotations(flattened, annotations);
      expect(untransformed).toEqual(unflattenedOutput ?? input);
    });
  }

  describe('when given a self-referencing object', () => {
    it('throws', () => {
      const a = { role: 'parent', children: [] as any[] };
      const b = { role: 'child', parent: [a] };
      a.children.push(b);

      expect(() => {
        serialize(a);
      }).toThrow(TypeError);
    });
  });
});
