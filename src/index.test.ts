import * as SuperJSON from './';
import { JSONValue, SuperJSONValue } from './types';
import { Annotations } from './annotator';

describe('stringify & parse', () => {
  const cases: Record<
    string,
    {
      input: SuperJSONValue;
      output: JSONValue;
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
          [NaN, 'b'],
        ]),
        b: new Map([['2', 'b']]),
        d: new Map([[true, 'true key']]),
      },

      output: {
        a: {
          1: 'a',
          NaN: 'b',
        },
        b: {
          2: 'b',
        },
        d: {
          true: 'true key',
        },
      },

      outputAnnotations: {
        values: {
          a: 'map:number',
          b: 'map:string',
          d: 'map:boolean',
        },
      },
    },

    'works for paths containing dots': {
      input: {
        'a.1': {
          b: new Set([1, 2]),
        },
      },
      output: {
        'a.1': {
          b: [1, 2],
        },
      },
      outputAnnotations: {
        values: {
          'a\\.1.b': 'set',
        },
      },
    },

    'works for paths containing backslashes': {
      input: {
        'a\\.1': {
          b: new Set([1, 2]),
        },
      },
      output: {
        'a\\.1': {
          b: [1, 2],
        },
      },
      outputAnnotations: {
        values: {
          'a\\\\.1.b': 'set',
        },
      },
    },

    'works for dates': {
      input: {
        meeting: {
          date: new Date(2020, 1, 1),
        },
      },
      output: {
        meeting: {
          date: new Date(2020, 1, 1).toISOString(),
        },
      },
      outputAnnotations: {
        values: {
          'meeting.date': 'Date',
        },
      },
    },

    'works for regex': {
      input: {
        a: /hello/g,
      },
      output: {
        a: '/hello/g',
      },
      outputAnnotations: {
        values: {
          a: 'regexp',
        },
      },
    },

    'works for Infinity': {
      input: {
        a: Number.POSITIVE_INFINITY,
      },
      output: {
        a: undefined,
      },
      outputAnnotations: {
        values: {
          a: 'Infinity',
        },
      },
    },

    'works for -Infinity': {
      input: {
        a: Number.NEGATIVE_INFINITY,
      },
      output: {
        a: undefined,
      },
      outputAnnotations: {
        values: {
          a: '-Infinity',
        },
      },
    },

    'works for NaN': {
      input: {
        a: NaN,
      },
      output: {
        a: undefined,
      },
      outputAnnotations: {
        values: {
          a: 'NaN',
        },
      },
    },

    'works for bigint': {
      input: {
        a: BigInt('1021312312412312312313'),
      },
      output: {
        a: '1021312312412312312313',
      },
      outputAnnotations: {
        values: {
          a: 'bigint',
        },
      },
    },
  };

  for (const [
    testName,
    {
      input,
      output: expectedOutput,
      outputAnnotations: expectedOutputAnnotations,
    },
  ] of Object.entries(cases)) {
    test(testName, () => {
      const { json, meta } = SuperJSON.serialize(input);

      expect(json).toEqual(expectedOutput);
      expect(meta).toEqual(expectedOutputAnnotations);

      const untransformed = SuperJSON.deserialize({ json, meta });
      expect(untransformed).toEqual(input);
    });
  }

  describe('when given a self-referencing object', () => {
    it('throws', () => {
      const a = { role: 'parent', children: [] as any[] };
      const b = { role: 'child', parent: [a] };
      a.children.push(b);

      expect(() => {
        SuperJSON.stringify(a);
      }).toThrow(TypeError);
    });
  });

  describe('when given a non-SuperJSON object', () => {
    it('throws', () => {
      expect(() => {
        SuperJSON.parse(
          JSON.stringify({
            value: {
              a: 1,
            },
            meta: {
              root: 'invalid_key',
            },
          })
        );
      }).toThrow();

      expect(() => {
        SuperJSON.parse(
          JSON.stringify({
            value: {
              a: 1,
            },
            meta: {
              values: {
                a: 'invalid_key',
              },
            },
          })
        );
      }).toThrow();
    });
  });
});
