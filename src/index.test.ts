import { deserialize, serialize } from './';

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

    const serialized = serialize(input);
    expect(serialized).toMatchInlineSnapshot(
      `"{\\"value\\":{\\"a\\":[\\"of\\",\\"values\\",1,2,\\"and\\",3],\\"with\\":{\\"a\\":{\\"2\\":\\"entries\\",\\"comprised\\":\\"of\\"}}},\\"meta\\":{\\"a\\":\\"set\\",\\"with\\":{\\"a\\":\\"map\\"}}}"`
    );

    const deserialized = deserialize(serialized);
    expect(deserialized).toEqual(input);
  });
});
