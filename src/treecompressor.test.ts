import { Tree } from './treeifier';
import { compress, uncompress } from './treecompressor';

describe('compress & uncompress', () => {
  interface TestCase {
    input: Tree;
    expectedOutput: Tree;
  }

  const cases: Record<string, TestCase> = {
    simple: {
      input: {
        this: { is: { a: { nested: 'tree' } } },
      },
      expectedOutput: {
        'this.is.a.nested': 'tree',
      },
    },
    'with keys that need escaping': {
      input: {
        'this.needs': { 'to.be': 'escaped' },
      },
      expectedOutput: {
        'this\\.needs.to\\.be': 'escaped',
      },
    },
  };

  Object.entries(cases).forEach(([name, testcase]) => {
    test(name, () => {
      const output = compress(testcase.input);
      expect(output).toEqual(testcase.expectedOutput);
      expect(uncompress(output)).toEqual(testcase.input);
    });
  });
});
