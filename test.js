/**
 * Module Dependencies
 */

var assert = require('assert')
var json = require('./')

/**
 * Test
 */

describe('superjson', function() {
  it('it should stringify undefined values', function() {
    var str = json.stringify({ name: undefined })
    assert.equal(str, '{"name":"undefined"}')
  })

  it('it should stringify undefined values', function() {
    var str = json.stringify([ undefined ])
    assert.equal(str, '["undefined"]')
  })

  it('it should parse undefined arrays', function() {
    var str = json.parse('["undefined", 1]')
    assert.equal(str[0], undefined)
    assert.equal(str[1], 1)
  })

  it('should parse undefined objects', function() {
    var obj = json.parse('{ "name": "undefined" }')
    assert.equal(typeof obj.name, 'undefined')
  })

  it('should work with null values', function() {
    var obj = json.parse('{ "name": null }')
    assert.equal(obj.name, null)
  })

  it('should properly stringify literals', function() {
    assert.equal(json.stringify(undefined), 'undefined')
    assert.equal(json.stringify('hi'), 'hi')
    assert.equal(json.stringify(3), 3)
  })

  it('should parse literals', function() {
    assert.equal(json.parse('undefined'), undefined)
    assert.equal(json.parse('hi'), 'hi')
    assert.equal(json.parse(3), 3)
  })

  it('should ignore regexp-like expressions', function() {
    assert.equal(json.parse('/hi'), '/hi')
  })

  it('should handle regexp', function() {
    assert.equal(json.parse('/^^hi/g').source, '^^hi')
  })

  it('should handle regexp errors', function() {
    assert.equal(json.parse('/[\\\]/'), '/[\\]/')
  })
})
