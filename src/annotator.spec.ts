import { makeAnnotator } from './annotator';

describe('annotator', () => {
  test('simple example', () => {
    const { annotations, annotator } = makeAnnotator();

    expect(
      annotator({
        isLeaf: true,
        path: ['a', 1, 'b'],
        node: undefined,
      })
    ).toBe(undefined);

    expect(annotations).toEqual({
      'a.1.b': 'undefined',
    });
  });
});
