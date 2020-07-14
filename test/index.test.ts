import { serialize, deserialize } from '../src';

describe('serialize works for', () => {
  /*
    Valid JSON
  */
  it('strings', () => {
    expect(serialize('abc')).toStrictEqual({ json: 'abc', meta: null });
  });

  it('numbers', () => {
    expect(serialize(123)).toStrictEqual({ json: 123, meta: null });
  });

  it('booleans', () => {
    expect(serialize(true)).toStrictEqual({ json: true, meta: null });
  });

  it('json arrays', () => {
    expect(serialize(['a', 'b', 'c'])).toStrictEqual({
      json: ['a', 'b', 'c'],
      meta: null,
    });
  });

  it('json objects', () => {
    expect(serialize({ a: 'a', b: 'b', c: 'c' })).toStrictEqual({
      json: { a: 'a', b: 'b', c: 'c' },
      meta: null,
    });
  });

  it('null', () => {
    expect(serialize(null)).toStrictEqual({ json: null, meta: null });
  });

  /*
    Other primitives
  */
  it('undefined', () => {
    expect(serialize(undefined)).toStrictEqual({
      json: 'undefined',
      meta: 'undefined',
    });
  });

  it('bigint', () => {
    expect(serialize(BigInt(10))).toStrictEqual({
      json: '10',
      meta: 'bigint',
    });
  });

  it('big bigint', () => {
    expect(serialize(BigInt(Number.MAX_VALUE) + BigInt(10))).toStrictEqual({
      json: (BigInt(Number.MAX_VALUE) + BigInt(10)).toString(),
      meta: 'bigint',
    });
  });

  /*
    Basic objects
  */
  it('dates', () => {
    expect(serialize(new Date(0))).toStrictEqual({
      json: '1970-01-01T00:00:00.000Z',
      meta: 'Date',
    });
  });

  /*
    Complex
  */
  it('complex tree', () => {
    expect(
      serialize({
        a: 'a',
        b: { c: 'c', d: [undefined, 2, 3, ['a', 'b', 'c']] },
        'x.y': undefined,
      })
    ).toStrictEqual({
      json: {
        a: 'a',
        b: { c: 'c', d: ['undefined', 2, 3, ['a', 'b', 'c']] },
        'x.y': 'undefined',
      },
      meta: { 'b.d.0': 'undefined', 'x\\.y': 'undefined' },
    });
  });
});

describe('deserialize works for', () => {
  /*
    Valid JSON
  */
  it('strings', () => {
    expect(deserialize({ json: 'abc', meta: null })).toStrictEqual('abc');
  });

  it('numbers', () => {
    expect(deserialize({ json: 123, meta: null })).toStrictEqual(123);
  });

  it('booleans', () => {
    expect(deserialize({ json: true, meta: null })).toStrictEqual(true);
  });

  it('json arrays', () => {
    expect(
      deserialize({
        json: ['a', 'b', 'c'],
        meta: null,
      })
    ).toStrictEqual(['a', 'b', 'c']);
  });

  it('json objects', () => {
    expect(
      deserialize({
        json: { a: 'a', b: 'b', c: 'c' },
        meta: null,
      })
    ).toStrictEqual({ a: 'a', b: 'b', c: 'c' });
  });

  it('null', () => {
    expect(deserialize({ json: null, meta: null })).toStrictEqual(null);
  });

  /*
    Other primitives
  */
  it('undefined', () => {
    expect(
      deserialize({
        json: 'undefined',
        meta: 'undefined',
      })
    ).toStrictEqual(undefined);
  });

  it('bigint', () => {
    expect(
      deserialize({
        json: 10,
        meta: 'bigint',
      })
    ).toStrictEqual(BigInt(10));
  });

  /*
    Basic objects
  */
  it('dates', () => {
    expect(
      deserialize({
        json: '1970-01-01T00:00:00.000Z',
        meta: 'Date',
      })
    ).toStrictEqual(new Date(0));
  });

  /*
    Complex
  */
  it('complex tree', () => {
    expect(
      deserialize({
        json: {
          a: 'a',
          b: { c: 'c', d: ['undefined', 2, 3, ['a', 'b', 'c']] },
          'x.y': 'undefined',
        },
        meta: { 'b.d.0': 'undefined', 'x\\.y': 'undefined' },
      })
    ).toStrictEqual({
      a: 'a',
      b: { c: 'c', d: [undefined, 2, 3, ['a', 'b', 'c']] },
      'x.y': undefined,
    });
  });
});
