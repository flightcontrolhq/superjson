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

At [Blitz](https://github.com/blitz-js/blitz), we have struggled with the limitations of JSON. Modern databases often store complex types, like Date objects, but it impossible to easily `stringify` your responses without converting any object types to strings. Moreover, you often have to keep track of which fields you need to convert back to objects in your client!

Superjson solves these issues by providing a thin wrapper over `JSON.stringify` and `JSON.parse`. Look at the difference between manually converting invalid fields, and using Superjson to handle this for you:


```js
// 😔 without superjson

// retrieve user object
const user = await db.user.findOne();

/* 
user = {
  id: 1,
  createdAt: new Date(1),
  updatedAt: new Date(2),
  name: undefined,
  email: 'me@here.com',
  posts: [
    {
      id: 1,
      createdAt: new Date(3),
      updatedAt: new Date(4),
      body: 'hello world!',
    },
  ],
}; 
*/

// manually update invalid fields 
const serializableUser = {
  ...user,
  createdAt: user.createdAt.toIsoString(),
  updatedAt: user.updatedAt.toIsoString(),
  name: 'undefined',
  posts: user.posts.map(post => ({
    ...post,
    createdAt: post.createdAt.toIsoString(),
    updatedAt: post.updatedAt.toIsoString(),
  })),
};

// api response
return JSON.stringify(serializableUser);

// fetch user from api response
const res = await fetch('/api/user');
const json = await res.json();

// restore fields
const user = {
  ...res,
  createdAt: new Date(res.createdAt),
  updatedAt: new Date(res.updatedAt),
  name: undefined,
  posts: res.posts.map(post => ({
    ...post,
    createdAt: new Date(post.createdAt),
    updatedAt: new Date(post.createdAt),
  })),
};
```

```js
// ✨ with superjson

// retrieve user object
const user = await db.user.findOne();

/* 
user = {
  id: 1,
  createdAt: new Date(1),
  updatedAt: new Date(2),
  name: undefined,
  email: 'me@here.com',
  posts: [
    {
      id: 1,
      createdAt: new Date(3),
      updatedAt: new Date(4),
      body: 'hello world!',
    },
  ],
}; 
*/

// api response
return superjson.stringify(serializableUser);

// fetch user from api response
const res = await fetch('/api/user');

// restore fields
const user = superjson.parse(res);
```

## Getting started

Install the library with your package manager of choice, e.g.:

```
yarn add superjson
```

## Usage

The simplest way of using `superjson` is with its `stringify` and `parse` functions. If you know how to use `JSON.stringify` in JavaScript, you already know Superjson!

Simply stringify any expression you’d like:

```js
import { stringify } from 'superjson';

const json = stringify({date: new Date(0)});
```

And parse your JSON like so:

```js
import { parse } from 'superjson';

const object = stringify(json);
```

Alternatively, you can use our lower-level `serializer` and `deserializer` functions. These transform any JavaScript expression into an object which is valid for JSON serialization.

For example:

```js
const object = {
  normal: 'string',
  timestamp: new Date(),
  test: /superjson/,
};

const {json, meta} = serialize(object);

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

Superjson supports many extra types which JSON does not. You can serialize all these:

| type        | supported by standard JSON? |
|-------------|-----------------------------|
| `string`    | ✅                           |
| `number`    | ✅                           |
| `boolean`   | ✅                           |
| `null`      | ✅                           |
| `Array`     | ✅                           |
| `Object`    | ✅                           |
| `undefined` | ❌                           |
| `bigint`    | ❌                           |
| `Date`      | ❌                           |
| `RegExp`    | ❌                           |
| `Set`       | ❌                           |
| `Map`       | ❌                           |

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

There are many libraries similar to Superjson:

- [Serialize JavaScript](https://github.com/yahoo/serialize-javascript) by Eric Ferraiuolo
- [devalue](https://github.com/Rich-Harris/devalue) by Rich Harris
