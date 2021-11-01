import { Registry } from './registry';
import { Class } from './types';

test('class registry', () => {
  const registry = new Registry<Class>(c => c.name);

  class Car {
    honk() {
      console.log('honk');
    }
  }
  registry.register(Car);

  expect(registry.getValue('Car')).toBe(Car);
  expect(registry.getIdentifier(Car)).toBe('Car');

  expect(() => registry.register(Car)).not.toThrow();

  const warnSpy = jest.spyOn(console, 'debug');

  registry.register(class Car {});
  expect(warnSpy).toHaveBeenCalledTimes(1);
  expect(warnSpy.mock.calls[0][0]).toContain(
    'Ambiguous class "Car", provide a unique identifier.'
  );

  registry.register(class Car {}, 'car2');

  expect(registry.getValue('car2')).not.toBeUndefined();

  registry.clear();

  expect(registry.getValue('car1')).toBeUndefined();
});
