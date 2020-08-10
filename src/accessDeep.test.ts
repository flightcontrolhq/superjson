import { setDeep } from './accessDeep';

describe('setDeep', () => {
  it('correctly sets values in maps', () => {
    const obj = {
      a: new Map([['NaN', 10]]),
    };

    setDeep(obj, ['a', 0, 0], Number);

    expect(obj).toEqual({
      a: new Map([[NaN, 10]]),
    });
  });

  it('correctly sets values in sets', () => {
    const obj = {
      a: new Set(['NaN']),
    };

    setDeep(obj, ['a', 0], Number);

    expect(obj).toEqual({
      a: new Set([NaN]),
    });
  });
});
