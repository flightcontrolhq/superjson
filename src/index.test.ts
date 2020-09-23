import SuperJSON from './';
import { JSONValue, SuperJSONValue } from './types';
import { Annotations } from './annotator';
import { isArray, isMap, isPlainObject, isPrimitive, isSet } from './is';

describe('stringify & parse', () => {
  const cases: Record<
    string,
    {
      input: (() => SuperJSONValue) | SuperJSONValue;
      output: JSONValue;
      outputAnnotations?: Annotations;
      customExpectations?: (value: any) => void;
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
        a: [1, null, 2],
      },
      outputAnnotations: {
        values: {
          'a.1': ['undefined'],
        },
      },
    },

    'works for Sets': {
      input: {
        a: new Set([1, undefined, 2]),
      },
      output: {
        a: [1, null, 2],
      },
      outputAnnotations: {
        values: {
          a: ['set', { 1: ['undefined'] }],
        },
      },
    },

    'works for top-level Sets': {
      input: new Set([1, undefined, 2]),
      output: [1, null, 2],
      outputAnnotations: {
        values: ['set', { 1: ['undefined'] }],
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
        a: [
          [1, 'a'],
          ['NaN', 'b'],
        ],
        b: [['2', 'b']],
        d: [[true, 'true key']],
      },

      outputAnnotations: {
        values: {
          a: ['map', { '1.0': ['number'] }],
          b: ['map'],
          d: ['map'],
        },
      },
    },

    'preserves object identity': {
      input: () => {
        const a = { id: 'a' };
        const b = { id: 'b' };
        return {
          options: [a, b],
          selected: a,
        };
      },
      output: {
        options: [{ id: 'a' }, { id: 'b' }],
        selected: { id: 'a' },
      },
      outputAnnotations: {
        referentialEqualities: {
          selected: [{ options: ['0'] }],
        },
      },
      customExpectations: output => {
        expect(output.selected).toBe(output.options[0]);
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
          'a\\.1.b': ['set'],
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
          'a\\\\.1.b': ['set'],
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
          'meeting.date': ['Date'],
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
          a: ['regexp'],
        },
      },
    },

    'works for Infinity': {
      input: {
        a: Number.POSITIVE_INFINITY,
      },
      output: {
        a: 'Infinity',
      },
      outputAnnotations: {
        values: {
          a: ['number'],
        },
      },
    },

    'works for -Infinity': {
      input: {
        a: Number.NEGATIVE_INFINITY,
      },
      output: {
        a: '-Infinity',
      },
      outputAnnotations: {
        values: {
          a: ['number'],
        },
      },
    },

    'works for NaN': {
      input: {
        a: NaN,
      },
      output: {
        a: 'NaN',
      },
      outputAnnotations: {
        values: {
          a: ['number'],
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
          a: ['bigint'],
        },
      },
    },

    'works for self-referencing objects': {
      input: () => {
        const a = { role: 'parent', children: [] as any[] };
        const b = { role: 'child', parents: [a] };
        a.children.push(b);
        return a;
      },
      output: {
        role: 'parent',
        children: [
          {
            role: 'child',
            parents: [null],
          },
        ],
      },
      outputAnnotations: {
        referentialEqualities: [{ 'children.0.parents': ['0'] }],
      },
    },

    'works for Maps with two keys that serialize to the same string but have a different reference': {
      input: new Map([
        [/a/g, 'foo'],
        [/a/g, 'bar'],
      ]),
      output: [
        ['/a/g', 'foo'],
        ['/a/g', 'bar'],
      ],
      outputAnnotations: {
        values: [
          'map',
          {
            '0.0': ['regexp'],
            '1.0': ['regexp'],
          },
        ],
      },
    },

    "works for Maps with a key that's referentially equal to another field": {
      input: () => {
        const robbyBubble = { id: 5 };
        const highscores = new Map([[robbyBubble, 5000]]);
        return {
          highscores,
          topScorer: robbyBubble,
        } as any;
      },
      output: {
        highscores: [[{ id: 5 }, 5000]],
        topScorer: { id: 5 },
      },
      outputAnnotations: {
        values: {
          highscores: ['map'],
        },
        referentialEqualities: {
          topScorer: [{ 'highscores.0': ['0'] }] as any,
        },
      },
    },

    'works for referentially equal maps': {
      input: () => {
        const map = new Map([[1, 1]]);
        return {
          a: map,
          b: map,
        };
      },
      output: {
        a: [[1, 1]],
        b: [[1, 1]],
      },
      outputAnnotations: {
        values: {
          a: ['map'],
          b: ['map'],
        },
        referentialEqualities: {
          a: [['b']],
        },
      },
      customExpectations: value => {
        expect(value.a).toBe(value.b);
      },
    },

    'works for maps with non-uniform keys': {
      input: {
        map: new Map<string | number, number>([
          [1, 1],
          ['1', 1],
        ]),
      },
      output: {
        map: [
          [1, 1],
          ['1', 1],
        ],
      },
      outputAnnotations: {
        values: {
          map: ['map'],
        },
      },
    },

    'works for referentially equal values inside a set': {
      input: () => {
        const user = { id: 2 };
        return {
          users: new Set([user]),
          userOfTheMonth: user,
        };
      },
      output: {
        users: [{ id: 2 }],
        userOfTheMonth: { id: 2 },
      },
      outputAnnotations: {
        values: {
          users: ['set'],
        },
        referentialEqualities: {
          userOfTheMonth: [{ users: ['0'] }],
        },
      },
      customExpectations: value => {
        expect(value.users.values().next().value).toBe(value.userOfTheMonth);
      },
    },

    'works for symbols': {
      input: () => {
        const parent = Symbol('Parent');
        const child = Symbol('Child');
        SuperJSON.registerSymbol(parent, '1');
        SuperJSON.registerSymbol(child, '2');

        const a = { role: parent };
        const b = { role: child };

        return { a, b };
      },
      output: {
        a: { role: 'Parent' },
        b: { role: 'Child' },
      },
      outputAnnotations: {
        values: {
          'a.role': [['symbol', '1']],
          'b.role': [['symbol', '2']],
        },
      },
    },

    'issue #58': {
      input: () => {
        const cool = Symbol('cool');
        SuperJSON.registerSymbol(cool);
        return {
          q: [
            9,
            {
              henlo: undefined,
              yee: new Date(2020, 1, 1),
              yee2: new Date(2020, 1, 1),
              foo1: new Date(2020, 1, 1),
              z: cool,
            },
          ],
        };
      },
      output: {
        q: [
          9,
          {
            henlo: null,
            yee: new Date(2020, 1, 1).toISOString(),
            yee2: new Date(2020, 1, 1).toISOString(),
            foo1: new Date(2020, 1, 1).toISOString(),
            z: 'cool',
          },
        ],
      },
      outputAnnotations: {
        values: {
          'q.1.henlo': ['undefined'],
          'q.1.yee': ['Date'],
          'q.1.yee2': ['Date'],
          'q.1.foo1': ['Date'],
          'q.1.z': [['symbol', 'cool']],
        },
      },
    },

    'works for undefined, issue #48': {
      input: undefined,
      output: null,
      outputAnnotations: { values: ['undefined'] },
    },
  };

  function deepFreeze(object: any, alreadySeenObjects = new Set()) {
    if (isPrimitive(object)) {
      return;
    }

    if (alreadySeenObjects.has(object)) {
      return;
    } else {
      alreadySeenObjects.add(object);
    }

    if (isPlainObject(object)) {
      Object.values(object).forEach(o => deepFreeze(o, alreadySeenObjects));
    }

    if (isSet(object)) {
      object.forEach(o => deepFreeze(o, alreadySeenObjects));
    }

    if (isArray(object)) {
      object.forEach(o => deepFreeze(o, alreadySeenObjects));
    }

    if (isMap(object)) {
      object.forEach((value, key) => {
        deepFreeze(key, alreadySeenObjects);
        deepFreeze(value, alreadySeenObjects);
      });
    }

    Object.freeze(object);
  }

  for (const [
    testName,
    {
      input,
      output: expectedOutput,
      outputAnnotations: expectedOutputAnnotations,
      customExpectations,
    },
  ] of Object.entries(cases)) {
    test(testName, () => {
      const inputValue = typeof input === 'function' ? input() : input;

      // let's make sure SuperJSON doesn't mutate our input!
      deepFreeze(inputValue);
      const { json, meta } = SuperJSON.serialize(inputValue);

      expect(json).toEqual(expectedOutput);
      expect(meta).toEqual(expectedOutputAnnotations);

      const untransformed = SuperJSON.deserialize({ json, meta });
      expect(untransformed).toEqual(inputValue);
      customExpectations?.(untransformed);
    });
  }

  describe('when serializing custom class instances', () => {
    it('revives them to their original class', () => {
      class Train {
        constructor(
          private topSpeed: number,
          private color: 'red' | 'blue' | 'yellow',
          private brand: string
        ) {}

        public brag() {
          return `I'm a ${this.brand} in freakin' ${this.color} and I go ${this.topSpeed} km/h, isn't that bonkers?`;
        }
      }

      SuperJSON.registerClass(Train);

      const { json, meta } = SuperJSON.serialize({
        s7: new Train(100, 'yellow', 'Bombardier') as any,
      });

      expect(json).toEqual({
        s7: {
          topSpeed: 100,
          color: 'yellow',
          brand: 'Bombardier',
        },
      });

      expect(meta).toEqual({
        values: {
          s7: [['class', 'Train']],
        },
      });

      const deserialized: any = SuperJSON.deserialize(
        JSON.parse(JSON.stringify({ json, meta }))
      );
      expect(deserialized.s7).toBeInstanceOf(Train);
      expect(typeof deserialized.s7.brag()).toBe('string');
    });

    describe('with accessor attributes', () => {
      it('works', () => {
        class Currency {
          constructor(private valueInUsd: number) {}

          get inUSD() {
            return this.valueInUsd;
          }
        }

        SuperJSON.registerClass(Currency);

        const { json, meta } = SuperJSON.serialize({
          price: new Currency(100) as any,
        });

        expect(json).toEqual({
          price: {
            valueInUsd: 100,
          },
        });

        const result: any = SuperJSON.parse(JSON.stringify({ json, meta }));

        const price: Currency = result.price;

        expect(price.inUSD).toBe(100);
      });
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
