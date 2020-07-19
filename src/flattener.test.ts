import { flatten, unflatten } from './flattener';

describe('flatten & unflatten', () => {
  const cases = [
    {
      input: {
        a: { 1: { b: 'c' }, b: [1, 2, 3] },
      },
      output: {
        'a.1.b': 'c',
        'a.b.0': 1,
        'a.b.1': 2,
        'a.b.2': 3,
      },
    },
    {
      input: {
        'a.b': 1,
      },
      output: {
        'a\\.b': 1,
      },
    },
    {
      input: {
        'a\\b': 1,
      },
      output: {
        'a\\b': 1,
      },
    },
    {
      input: {
        'a\\.b': 1,
      },
      output: {
        'a\\\\.b': 1,
      },
    },
  ];

  cases.forEach((testCase, index) => {
    test('#' + index, () => {
      const { input, output } = testCase;
      const flattened = flatten(input);
      expect(flattened).toEqual(output);

      const unflattened = unflatten(flattened);
      expect(unflattened).toEqual(input);
    });
  });
});
