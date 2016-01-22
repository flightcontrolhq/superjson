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

  it('it should stringify undefined values', function() {
    var str = json.parse('["undefined"]')
    assert.deepEqual(str, [undefined])
  })

  it('should parse undefined values', function() {
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
})
