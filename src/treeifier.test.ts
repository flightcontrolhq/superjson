import { TreeEntry, treeify, detreeify } from './treeifier';

describe('treeify & detreeify', () => {
  interface TestCase {
    input: TreeEntry[];
    expectedOutput: object;
  }

  const cases: Record<string, TestCase> = {
    simple: {
      input: [
        {
          path: ['hello', 'world'],
          value: 'lol',
        },
        {
          path: ['hello', 'reader'],
          value: 'lel',
        },
      ],
      expectedOutput: {
        hello: {
          world: 'lol',
          reader: 'lel',
        },
      },
    },
    rootHasValue: {
      input: [
        {
          path: [],
          value: 'lol',
        },
        {
          path: ['hello'],
          value: 'world',
        },
      ],
      expectedOutput: [
        'lol',
        {
          hello: 'world',
        },
      ],
    },
  };

  Object.entries(cases).forEach(([name, testcase]) => {
    test(name, () => {
      const output = treeify(testcase.input);
      expect(output).toEqual(testcase.expectedOutput);
      expect(detreeify(output)).toEqual(testcase.input);
    });
  });
});
