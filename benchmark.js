const Benchmark = require('benchmark');
const SuperJSON = require('./dist/').default;

const instances = {
  'toy example': {
    a: new Map([
      [1, NaN],
      [2, null],
      [3, 'Hurray'],
    ]),
    a: /regexp/g,
    b: [new Set([1, 2, 3])],
  },
  'user graph': {
    users: new Map([
      [
        'abcde',
        {
          id: 'abcde',
          created: new Date(2020),
          friendIds: new Set(['a', 'b', 'c']),
        },
      ],
      [
        'dasdfa',
        {
          id: 'dasdfa',
          created: new Date(2019),
          friendIds: new Set(['b', 'c']),
        },
      ],
      [
        'hu-ha-hu',
        {
          id: 'hu-ha-hu',
          created: new Date(2018),
          friendIds: new Set(['b', 'c', 'd', 'f']),
        },
      ],
      [
        'umphrey',
        { id: 'umphrey', created: new Date(2017), friendIds: new Set([]) },
      ],
    ]),
  },
  'deep nested': (() => {
    const data = [];
    for (let i = 0; i < 100; i++) {
      let nested1 = [];
      let nested2 = [];
      for (let j = 0; j < 10; j++) {
        nested1[j] = {
          createdAt: new Date(),
          updatedAt: new Date(),
          innerNested: {
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        };
        nested2[j] = {
          createdAt: new Date(),
          updatedAt: new Date(),
          innerNested: {
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        };
      }
      const object = {
        createdAt: new Date(),
        updatedAt: new Date(),
        nested1,
        nested2,
      };
      data.push(object);
    }
    return data;
  })(),
};

const suite = new Benchmark.Suite('serialize & deserialize');

for (const [key, instance] of Object.entries(instances)) {
  suite.add(key, () => {
    SuperJSON.deserialize(SuperJSON.serialize(instance));
  });
}

suite.on('cycle', event => {
  console.log('' + event.target);
});

suite.run();
