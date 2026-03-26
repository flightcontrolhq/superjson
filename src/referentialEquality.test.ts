import SuperJSON from './index.js';
import { RecursiveCustomTransfomer } from './custom-transformer-registry.js';

import { expect, test, describe } from 'vitest';

/** ----------------------------
 * Tests
 * ---------------------------- */

describe('Referential equality tests', () => {
  test('basic referential equalities', () => {
    const shared = { key: 'value' };
    const input = { a: shared, b: shared, c: { ...shared, d: shared } };
    equalityTest(input);
  });

  test('preserves external (input) recursive referential equality', () => {
    class Box {
      constructor(public value: any) {}
    }

    registerCustom(
      {
        isApplicable: (v): v is Box => v instanceof Box,
        serialize: v => v.value,
        deserialize: v => new Box(v),
        recursive: true,
      },
      'Box'
    );

    const shared = { when: new Date('2024-01-01T00:00:00.000Z') };
    const input = {
      a: new Box(shared),
      b: shared,
    };
    equalityTest(input);
  });

  test('shared object with recursive transformation inside', () => {
    class Horse {
      constructor() {}
    }

    registerCustom(
      {
        isApplicable: (v): v is Horse => v instanceof Horse,
        serialize: (v: Horse) => 'Horse',
        deserialize: (v: string) => new Horse(),
        recursive: true,
      },
      'Horse'
    );

    const shared = { nest: { horse: new Horse() } };
    const input = {
      first: shared,
      second: shared,
    };
    equalityTest(input);
  });

  test('custom transformation returns same object', () => {
    class Animal {
      constructor(public value: any) {}
    }
    class Cow {
      constructor(public value: any) {}
    }

    registerCustom(
      {
        isApplicable: (v): v is Animal => v instanceof Animal,
        serialize: v => v.value,
        deserialize: v => new Animal(v),
        recursive: true,
      },
      'Animal'
    );
    registerCustom(
      {
        isApplicable: (v): v is Cow => v instanceof Cow,
        serialize: v => v.value,
        deserialize: v => new Cow(v),
        recursive: true,
      },
      'Cow'
    );

    const shared = { when: new Date() };
    const input = new Animal(new Cow(shared));
    equalityTest(input);
  });

  test('object inside custom transformation', () => {
    class Boxer {
      constructor(public value: any) {}
    }
    class Wrestler {
      constructor(public value: any) {}
    }

    registerCustom(
      {
        isApplicable: (v): v is Boxer => v instanceof Boxer,
        serialize: v => v.value,
        deserialize: v => new Boxer(v),
        recursive: true,
      },
      'Boxer'
    );
    registerCustom(
      {
        isApplicable: (v): v is Wrestler => v instanceof Wrestler,
        serialize: v => v.value,
        deserialize: v => new Wrestler(v),
        recursive: true,
      },
      'Wrestler'
    );

    const boxer = { boxer: new Boxer({ when: new Date() }) };
    const input = new Wrestler(boxer);
    equalityTest(input);
  });

  test('root shared reference', () => {
    const input: any = { when: new Date() };
    input.ref = input;
    equalityTest(input);
  });

  test('shared references inside arrays', () => {
    const shared = { key: 'value' };
    const input = {
      arr: [shared, shared, { nested: shared }],
      arr2: [1, shared, shared],
    };
    equalityTest(input);
  });

  test('circular reference NOT at root', () => {
    const input: any = { a: { b: { c: {} } } };
    input.a.b.c.back = input.a; // cycle deeper in the tree
    input.a.b.d = input.a.b; // another cycle
    equalityTest(input);
  });

  test('shared built-in objects (Date, RegExp, Error)', () => {
    const sharedDate = new Date('2024-01-01T00:00:00.000Z');
    const sharedRegExp = /test/gi;
    const sharedError = new Error('shared error');
    const input = {
      dates: [sharedDate, sharedDate],
      regexps: { a: sharedRegExp, b: sharedRegExp },
      errors: { e1: sharedError, e2: sharedError, nested: { e3: sharedError } },
    };
    equalityTest(input);
  });

  test('shared recursive custom transformation', () => {
    class MyClass {
      constructor(public data: any) {}
    }

    registerCustom(
      {
        isApplicable: (v): v is MyClass => v instanceof MyClass,
        serialize: v => ({ data: v.data }),
        deserialize: v => new MyClass(v.data),
        recursive: true,
      },
      'MyClass'
    );

    const sharedData = { foo: 'bar' };
    const sharedInstance = new MyClass(sharedData);
    const input = {
      d: sharedData,
      x: sharedInstance,
      y: sharedInstance,
      nested: { z: sharedInstance },
    };
    equalityTest(input);
  });

  test('multiple independent shared groups', () => {
    const groupA = { id: 'A' };
    const groupB = { id: 'B' };
    const groupC = { id: 'C' };
    const input = {
      a1: groupA,
      a2: groupA,
      b1: groupB,
      b2: groupB,
      c: groupC,
      nested: {
        a3: groupA,
        b3: groupB,
        c2: groupC,
      },
    };
    equalityTest(input);
  });

  test('shared values inside Maps and Sets', () => {
    const shared = { key: 'shared-value' };
    const input = {
      set1: new Set([shared, { other: 1 }]),
      set2: new Set([shared, { other: 2 }]),
      map1: new Map([['k1', shared]]),
      map2: new Map([['k2', shared]]),
      mixed: {
        set3: new Set([shared]),
        map3: new Map([['k3', shared]]),
      },
    };
    equalityTest(input);
  });

  test('shared object used as Map key', () => {
    const sharedKey = { id: 42 };
    const input = {
      map1: new Map([[sharedKey, 'value1']]),
      map2: new Map([[sharedKey, 'value2']]),
      nested: new Map([['inner', sharedKey]]),
    };
    equalityTest(input);
  });

  test('All of the above', () => {
    class A {
      constructor(public value: any) {}
    }
    class B {
      constructor(public value: any) {}
    }
    class C {
      constructor(public value: any) {}
    }

    registerCustom(
      {
        isApplicable: (v): v is A => v instanceof A,
        serialize: v => v.value,
        deserialize: v => new A(v),
        recursive: true,
      },
      'A'
    );
    registerCustom(
      {
        isApplicable: (v): v is B => v instanceof B,
        serialize: v => v.value,
        deserialize: v => new B(v),
        recursive: true,
      },
      'B'
    );
    registerCustom(
      {
        isApplicable: (v): v is C => v instanceof C,
        serialize: v => v.value,
        deserialize: v => new C(v),
        recursive: true,
      },
      'C'
    );

    const sharedDate = new Date();
    const sharedObject = { when: sharedDate };
    const sharedClass = { a: new A(sharedObject) };
    const input: any = {
      obj1: { ...sharedObject, b: { c: {} } },
      obj2: sharedObject,
      date: sharedDate,
      cls: sharedClass,
      value: new C(new B(sharedClass)),
      set: new Set([sharedClass]),
      map: new Map([[sharedDate, sharedObject]]),
    };
    input.ref = input;
    input.obj1.b.c.back = input.obj;
    equalityTest(input);
  });
});

/** ----------------------------
 * Helpers
 * ---------------------------- */

type Path = string[];

function collectReferencePairs(obj: any): [Path, Path][] {
  if (obj == null || typeof obj !== 'object') {
    return [];
  }

  const referenceMap = new Map<any, Path[]>();
  const recursionStack = new Set<any>();

  referenceMap.set(obj, [[]]);

  traverse(obj, [], referenceMap, recursionStack);

  const pairs: [Path, Path][] = [];
  for (const paths of referenceMap.values()) {
    if (paths.length >= 2) {
      for (let i = 0; i < paths.length; i++) {
        for (let j = i + 1; j < paths.length; j++) {
          pairs.push([paths[i], paths[j]]);
        }
      }
    }
  }

  return pairs;
}

function traverse(
  currentObj: any,
  currentPath: Path,
  referenceMap: Map<any, Path[]>,
  recursionStack: Set<any>
): void {
  const entries = Object.entries(parseMapAndSet(currentObj));

  for (const [key, value] of entries) {
    const path: Path = [...currentPath, key];

    if (value !== null && typeof value === 'object') {
      if (!referenceMap.has(value)) {
        referenceMap.set(value, []);
      }
      referenceMap.get(value)!.push(path);

      if (!recursionStack.has(value)) {
        recursionStack.add(value);
        traverse(value, path, referenceMap, recursionStack);
        recursionStack.delete(value);
      }
    }
  }
}

function getValueAtPath(obj: any, path: Path): any {
  let current = obj;
  for (const key of path) {
    if (current == null || typeof current !== 'object') {
      throw new Error('Out of bounds error');
    }
    current = parseMapAndSet(current);
    current = current[key];
  }
  return current;
}

function parseMapAndSet(object: any) {
  if (object instanceof Map || object instanceof Set) return [...object];
  return object;
}

function expectSameReferenceGraph(a: any, b: any) {
  const pairs = collectReferencePairs(a);

  for (const [path1, path2] of pairs) {
    const val1 = getValueAtPath(b, path1);
    const val2 = getValueAtPath(b, path2);
    expect(val1).toBe(val2);
  }
}

function createEqualityTests() {
  const dedupeTrue = new SuperJSON({ dedupe: true });
  const dedupeFalse = new SuperJSON({ dedupe: false });

  function registerCustom<I, O>(
    transformer: Omit<RecursiveCustomTransfomer<I, O>, 'name'>,
    name: string
  ) {
    dedupeTrue.registerCustom(transformer, name);
    dedupeFalse.registerCustom(transformer, name);
  }

  function equalityTest(input: any) {
    const dedupeTrueResult = dedupeTrue.deserialize(
      dedupeTrue.serialize(input)
    );
    const dedupeFalseResult = dedupeFalse.deserialize(
      dedupeFalse.serialize(input)
    );

    expect(dedupeTrueResult).toEqual(input);
    expect(dedupeFalseResult).toEqual(input);
    expectSameReferenceGraph(dedupeTrueResult, input);
    expectSameReferenceGraph(dedupeFalseResult, input);
  }

  return { registerCustom, equalityTest };
}

const { registerCustom, equalityTest } = createEqualityTests();
