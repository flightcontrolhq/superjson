
# superjson

  Extends JSON.stringify and JSON.parse to support additional JS types (Dates, RegExps, Functions, etc)

## Installation

```
npm install superjson
```

## Goal

  The goal of this project is to properly serialize and deserialize JSON structures. It'd be nice if this
  was as fast as possible, but consistent data types in and out is more important. If it's impossible
  to consistently serialize or deserialize an object, the library should throw.

## Example

```js
var json = require('superjson');

var str = json.stringify({
  date: new Date(),
  regexp: /[abc]d/,
  fn: function foo() {}
})

var obj = json.parse(str)
{
  date: date, // date instance
  regexp: /[abc]d/, // regexp instance
  fn: function foo() {} // foo function
}
```

## License

(The MIT License)

Copyright (c) 2014 Matthew Mueller &lt;matt@lapwinglabs.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
