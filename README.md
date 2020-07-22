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

## Backstory

At [Blitz](https://github.com/blitz-js/blitz), we have struggled with the limitations of JSON. Modern databases often store complex types, like Date objects, but it impossible to easily `stringify` your responses without converting any object types to strings. Moreover, you often have to keep track of which fields you need to convert back to objects in your client!

`superjson` solves these issues by providing a thin wrapper over `JSON.stringify` and `JSON.parse`. Look at the difference between manually converting invalid fields, and using `superjson` to handle this for you:


```js
// without superjson

const user = await db.user.findOne()

/*
json = {
  id: 1,
  createdAt:  Thu Jan 01 1970 01:00:00 GMT+0100 (Greenwich Mean Time)
  timestamp: "2020-06-20T04:56:50.293Z",
}
```


## Key features

- 🍱 Reliable serialization and deserialization
- 🔐 Type safety with autocompletion
- 🐾 Negligible runtime footprint
- 💫 Framework agnostic

## Example

```js
const input = {
  normal: 'string',
  timestamp: new Date(),
};

const { json, meta } = serialize(input);

/*
json = {
  normal: 'string',
  timestamp: "2020-06-20T04:56:50.293Z",
}

meta = {
  timestamp: 'Date',
}
*/
```

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/merelinguist"><img src="https://avatars3.githubusercontent.com/u/24858006?v=4" width="100px;" alt=""/><br /><sub><b>Dylan Brookes</b></sub></a><br /><a href="https://github.com/blitz-js/superjson/commits?author=merelinguist" title="Code">💻</a> <a href="https://github.com/blitz-js/superjson/commits?author=merelinguist" title="Documentation">📖</a> <a href="#design-merelinguist" title="Design">🎨</a></td>
    <td align="center"><a href="http://simonknott.de"><img src="https://avatars1.githubusercontent.com/u/14912729?v=4" width="100px;" alt=""/><br /><sub><b>Simon Knott</b></sub></a><br /><a href="https://github.com/blitz-js/superjson/commits?author=Skn0tt" title="Code">💻</a> <a href="#ideas-Skn0tt" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://twitter.com/flybayer"><img src="https://avatars3.githubusercontent.com/u/8813276?v=4" width="100px;" alt=""/><br /><sub><b>Brandon Bayer</b></sub></a><br /><a href="#ideas-flybayer" title="Ideas, Planning, & Feedback">🤔</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!