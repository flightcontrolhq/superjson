import { makeAnnotator } from './annotator';

describe('annotator', () => {
  test('simple example', () => {
    const { getAnnotations, annotator } = makeAnnotator();

    expect(
      annotator({
        isLeaf: true,
        path: ['a', 1, 'b'],
        node: undefined,
      })
    ).toBe(null);

    expect(getAnnotations()).toEqual({
      values: {
        'a.1.b': ['undefined'],
      },
    });
  });
});
