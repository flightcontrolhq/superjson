import * as ClassRegistry from './class-registry';

test('class registry', () => {
  class Car {
    honk() {
      console.log('honk');
    }
  }
  ClassRegistry.registerClass(Car);

  expect(ClassRegistry.getClass('Car')).toBe(Car);
  expect(ClassRegistry.getIdentifier(Car)).toBe('Car');

  expect(() => ClassRegistry.registerClass(Car)).not.toThrow();

  expect(() => ClassRegistry.registerClass(class Car {})).toThrow(
    'Ambiguous class, provide a unique identifier.'
  );

  ClassRegistry.unregisterClass(Car);

  expect(ClassRegistry.getClass('Car')).toBeUndefined();

  ClassRegistry.registerClass(Car, 'car1');

  ClassRegistry.registerClass(class Car {}, 'car2');

  expect(ClassRegistry.getClass('car1')).toBe(Car);

  expect(ClassRegistry.getClass('car2')).not.toBeUndefined();

  ClassRegistry.clear();

  expect(ClassRegistry.getClass('car1')).toBeUndefined();
});
