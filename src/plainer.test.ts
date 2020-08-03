import { plainer } from './plainer';

describe('plainer', () => {
  it('walks through the whole tree', () => {
    const input = {
      a: new Map([
        [2, 'hallo'],
        [undefined, null],
      ]),
      b: {
        c: new Set([1, 1, 2, /hallo/g]),
      },
      d: {
        0: 'a',
        1: 'b',
      },
    };

    const annotations: any = {};

    const output = plainer(input, ({ path, node }) => {
      annotations[path.join('.')] = node;
      return node;
    });

    expect(output).toEqual({
      a: [
        [2, 'hallo'],
        [undefined, null],
      ],
      b: {
        c: [1, 2, /hallo/g],
      },
      d: {
        0: 'a',
        1: 'b',
      },
    });

    expect(annotations).toMatchInlineSnapshot(`
      Object {
        "": Object {
          "a": Map {
            2 => "hallo",
            undefined => null,
          },
          "b": Object {
            "c": Set {
              1,
              2,
              /hallo/g,
            },
          },
          "d": Object {
            "0": "a",
            "1": "b",
          },
        },
        "a": Map {
          2 => "hallo",
          undefined => null,
        },
        "a.0.0": 2,
        "a.0.1": "hallo",
        "a.1.0": undefined,
        "a.1.1": null,
        "b": Object {
          "c": Set {
            1,
            2,
            /hallo/g,
          },
        },
        "b.c": Set {
          1,
          2,
          /hallo/g,
        },
        "b.c.0": 1,
        "b.c.1": 2,
        "b.c.2": /hallo/g,
        "d": Object {
          "0": "a",
          "1": "b",
        },
        "d.0": "a",
        "d.1": "b",
      }
    `);
  });
});
