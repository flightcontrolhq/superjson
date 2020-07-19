import { serialise, deserialise } from './';

describe('superjson', () => {
  it('works', () => {
    const input = {
      a: new Set(['of', 'values', 1, 2, 'and', 3]),
      with: {
        a: new Map([
          ['comprised', 'of'],
          ['2', 'entries'],
        ]),
      },
    };

    const serialised = serialise(input);

    expect(serialised).toMatchInlineSnapshot(
      `"{\\"value\\":{\\"a\\":[\\"of\\",\\"values\\",1,2,\\"and\\",3],\\"with\\":{\\"a\\":{\\"2\\":\\"entries\\",\\"comprised\\":\\"of\\"}}},\\"meta\\":{\\"a\\":\\"set\\",\\"with\\":{\\"a\\":\\"map\\"}}}"`
    );

    const deserialised = deserialise(serialised);

    expect(deserialised).toEqual(input);
  });
});
