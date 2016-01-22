/**
 * Module Dependencies
 */

var type = require('component-type');
var acorn = require('acorn');
var isArray = Array.isArray;
var json = require('json3');

/**
 * Regexps
 */

// https://github.com/moment/moment/blob/583f380740468db843154df31fa72647c6173d17/moment.js#L72
var rdate = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;
var rregexp = /^\/|\/([gimy]*)$/g;

/**
 * Stringify
 *
 * TODO: support other `replacer` types
 *
 * @param {Object} obj
 * @param {Function} replacer
 * @param {Number} spaces
 * @return {String}
 * @api public
 */

var stringify = exports.stringify = function (obj, replacer, space) {
  var str = json.stringify(obj, function(k, v) {
    return replacer ? replacer(k, coerce(v)) : coerce(v);
  }, space);

  return str[0] === '"' && str[str.length - 1] === '"'
    ? str.slice(1, -1)
    : str
}

/**
 * Parse
 *
 * TODO: support other `reviver` types
 *
 * @param {String} str
 * @param {Function} reviver
 * @return {Object}
 * @api public
 */

var parse = exports.parse = function(str, reviver) {
  if (str[0] !== '[' && str[0] !== '{') return revive(str)
  return json.parse(str, function(k, v) {
    return reviver ? reviver(k, revive(v)) : revive(v);
  });
}

/**
 * Coerce object to a string
 *
 * @param {Mixed} v
 * @return {String}
 */

function coerce(v) {
  switch(type(v)) {
    case 'date': return v.toISOString();
    case 'regexp': return v.toString();
    case 'function': return v.toString();
    case 'undefined': return 'undefined';
    default: return v;
  }
}

/**
 * Revive string to an object
 *
 * @param {Mixed} v
 * @return {Mixed}
 */

function revive(v) {
  if ('string' != type(v)) return v;
  if (rdate.test(v)) return stod(v);
  if ('undefined' === v) return undefined;
  if ('/' == v[0] && rregexp.test(v)) return stor(v);
  if ('function' == v.slice(0, 8) && '}' == v[v.length - 1] && isfn(v)) return stof(v);
  return v;
}

/**
 * String => Date
 *
 * @param {String} str
 * @return {Date}
 */

function stod(str) {
  var d = Date.parse(str);
  if (isNaN(d)) throw new Error('cannot convert string to date');
  return new Date(str);
}

/**
 * String => Regexp
 *
 * @param {String} str
 * @return {RegExp}
 */

function stor(str) {
  var i = str.lastIndexOf('/');
  var flags = str.slice(i + 1);
  return new RegExp(str.slice(1, i), flags);
}

/**
 * String => Function
 *
 * @param {String} str
 * @return {Function}
 */

function stof(str) {
  return new Function('return ' + str)();
}

/**
 * Parse the AST to ensure function & prevent XSS,
 * otherwise throw.
 *
 * https://github.com/lapwinglabs/superjson/issues/3
 *
 * @param {String} str
 * @return {Boolean}
 */

function isfn(str) {
  try {
    var obj = acorn.parse('(' + str + ')');
    return obj.body[0].expression.type == 'FunctionExpression';
  } catch (e) {
    throw new SyntaxError('"' + str + '" is not a function')
  }
}
