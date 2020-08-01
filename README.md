<p align="center">
  <img alt="superjson" src="./docs/superjson.png" width="300" />
</p>

<p align="center">
  Safely serialize JavaScript expressions to a superset of JSON, which includes Dates, BigInts, and more.
</p>

<p align="center">
  <!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
  <a href="#contributors-">
    <img
      alt="All Contributors"
      src="https://img.shields.io/badge/all_contributors-3-orange.svg"
    />
  </a>
  <!-- ALL-CONTRIBUTORS-BADGE:END -->
  <a href="https://www.npmjs.com/package/otion">
    <img alt="npm" src="https://img.shields.io/npm/v/superjson" />
  </a>
  <a href="https://lgtm.com/projects/g/blitz-js/superjson/context:javascript">
    <img
      alt="Language grade: JavaScript"
      src="https://img.shields.io/lgtm/grade/javascript/g/blitz-js/superjson.svg?logo=lgtm&logoWidth=18"
    />
  </a>

  <a href="https://github.com/blitz-js/superjson/actions">
    <img
      alt="CI"
      src="https://github.com/blitz-js/superjson/workflows/CI/badge.svg"
    />
  </a>
</p>

## Key features

- 🍱 Reliable serialization and deserialization
- 🔐 Type safety with autocompletion
- 🐾 Negligible runtime footprint
- 💫 Framework agnostic


## Backstory

At [Blitz](https://github.com/blitz-js/blitz), we have struggled with the limitations of JSON. We often find ourselves working with `Date`, `Map`, `Set` or `BigInt`, but `JSON.stringify` doesn't support any of them without going through the hassle of converting manually!

Superjson solves these issues by providing a thin wrapper over `JSON.stringify` and `JSON.parse`.

## Getting started

Install the library with your package manager of choice, e.g.:

```
yarn add superjson
```

## Usage

The easiest way to use Superjson is with its `stringify` and `parse` functions. If you know how to use `JSON.stringify`, you already know Superjson!

Easily stringify any expression you’d like:

```js
import superjson from 'superjson';

const jsonString = superjson.stringify({date: new Date(0)});
```

And parse your JSON like so:

```js
const object = superjson.parse(jsonString);
```

Alternatively, transform any JavaScript value into a JSON-compatible one by using our lower-level `serialize` and `deserialize` functions.

For example:

```js
const object = {
  normal: 'string',
  timestamp: new Date(),
  test: /superjson/,
};

const {json, meta} = superjson.serialize(object);

/*
json = {
  normal: 'string',
  timestamp: "2020-06-20T04:56:50.293Z",
  test: "/blitz/",
};

// note that `normal` is not included here; `meta` only has special cases
meta = {
  timestamp: 'date',
  test: 'regexp',
};
*/
```

## API

### serialize

Serializes any JavaScript value into a JSON-compatible object.

#### Examples

```js
const object = {
  normal: 'string',
  timestamp: new Date(),
  test: /superjson/,
};

const {json, meta} = serialize(object);
```

Returns **`json` and `meta`, both JSON-compatible values.**

## deserialize

Deserializes the output of Superjson back into your original value.

#### Examples

```js
const {json, meta} = serialize(object);

deserialize({json, meta});
```

Returns **`your original value`**.

### stringify

Serializes and then stringifies your JavaScript value.

#### Examples

```js
const object = {
  normal: 'string',
  timestamp: new Date(),
  test: /superjson/,
};

const jsonString = stringify(object);
```

Returns **`string`**.

### parse

Parses and then deserializes the JSON string returned by `stringify`.

#### Examples

```js
const jsonString = stringify(object);

parse(jsonString);s
```

Returns **`string`**.

***

Superjson supports many extra types which JSON does not. You can serialize all these:

| type        | supported by standard JSON? | supported by Superjson? |
|-------------|-----------------------------|-------------------------|
| `string`    | ✅                           | ✅                       |
| `number`    | ✅                           | ✅                       |
| `boolean`   | ✅                           | ✅                       |
| `null`      | ✅                           | ✅                       |
| `Array`     | ✅                           | ✅                       |
| `Object`    | ✅                           | ✅                       |
| `undefined` | ❌                           | ✅                       |
| `bigint`    | ❌                           | ✅                       |
| `Date`      | ❌                           | ✅                       |
| `RegExp`    | ❌                           | ✅                       |
| `Set`       | ❌                           | ✅                       |
| `Map`       | ❌                           | ✅                       |

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/merelinguist"><img src="https://avatars3.githubusercontent.com/u/24858006?v=4" width="100px;" alt=""/><br /><sub><b>Dylan Brookes</b></sub></a><br /><a href="https://github.com/blitz-js/superjson/commits?author=merelinguist" title="Code">💻</a> <a href="https://github.com/blitz-js/superjson/commits?author=merelinguist" title="Documentation">📖</a> <a href="#design-merelinguist" title="Design">🎨</a> <a href="https://github.com/blitz-js/superjson/commits?author=merelinguist" title="Tests">⚠️</a></td>
    <td align="center"><a href="http://simonknott.de"><img src="https://avatars1.githubusercontent.com/u/14912729?v=4" width="100px;" alt=""/><br /><sub><b>Simon Knott</b></sub></a><br /><a href="https://github.com/blitz-js/superjson/commits?author=Skn0tt" title="Code">💻</a> <a href="#ideas-Skn0tt" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/blitz-js/superjson/commits?author=Skn0tt" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://twitter.com/flybayer"><img src="https://avatars3.githubusercontent.com/u/8813276?v=4" width="100px;" alt=""/><br /><sub><b>Brandon Bayer</b></sub></a><br /><a href="#ideas-flybayer" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="http://jeremyliberman.com/"><img src="https://avatars3.githubusercontent.com/u/2754163?v=4" width="100px;" alt=""/><br /><sub><b>Jeremy Liberman</b></sub></a><br /><a href="https://github.com/blitz-js/superjson/commits?author=mrleebo" title="Tests">⚠️</a> <a href="https://github.com/blitz-js/superjson/commits?author=mrleebo" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## Prior art

Other libraries that aim to solve a similar problem:

- [Serialize JavaScript](https://github.com/yahoo/serialize-javascript) by Eric Ferraiuolo
- [devalue](https://github.com/Rich-Harris/devalue) by Rich Harris
