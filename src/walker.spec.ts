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
    annotations: [
      null,
      {
        a: [
          'map',
          {
            '0': [
              null,
              {
                '0': ['number'],
              },
            ],
          },
        ],
        b: ['regexp'],
      },
    ],
  });
});
