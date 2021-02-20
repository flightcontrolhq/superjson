import { walker } from './walker';

test('walker', () => {
  expect(
    walker({
      a: new Map([[NaN, null]]),
      b: /test/g,
    })
  ).toEqual({
    transformedValue: {
      a: [['NaN', null]],
      b: '/test/g',
    },
    annotations: {
      a: [
        'map',
        {
          '0.0': ['number'],
        },
      ],
      b: ['regexp'],
    },
  });
});
