import { PathTree } from './pathtree';

test('pathtree', () => {
  let tree = PathTree.create<string | null>(null);

  PathTree.append(tree, ['abc'], '1');

  expect(tree).toEqual([null, { abc: ['1'] }]);

  PathTree.append(tree, ['abc', 'd'], '2');

  expect(tree).toEqual([null, { abc: ['1'], 'abc.d': ['2'] }]);

  PathTree.append(tree, ['foo', 'bar'], '3');

  expect(tree).toEqual([
    null,
    { abc: ['1'], 'abc.d': ['2'], 'foo.bar': ['3'] },
  ]);

  PathTree.append(tree, ['foo', 'bar', 'lel', 'lol'], '4');

  expect(tree).toEqual([
    null,
    { abc: ['1'], 'abc.d': ['2'], 'foo.bar': ['3'], 'foo.bar.lel.lol': ['4'] },
  ]);

  const traversalResults: [string[], string | null][] = [];
  PathTree.traverse(tree, (v, path) => traversalResults.push([path, v]));
  expect(traversalResults).toEqual([
    [['abc'], '1'],
    [['abc', 'd'], '2'],
    [['foo', 'bar'], '3'],
    [['foo', 'bar', 'lel', 'lol'], '4'],
    [[], null],
  ]);
});
