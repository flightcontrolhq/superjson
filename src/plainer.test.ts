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
    };

    const annotations: any = {};

    const output = plainer(input, ({ path, node }) => {
      annotations[path.join('.')] = node;
      return node;
    });

    expect(output).toEqual({
      a: {
        2: 'hallo',
        undefined: null,
      },
      b: {
        c: [1, 2, /hallo/g],
      },
    });
  });
});
