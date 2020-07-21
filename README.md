<p align="center">
  <img alt="superjson" src="./docs/superjson.png" width="300" />
</p>

<p align="center">
  Safely work with dates, bigints, and more with this superset of JSON.
</p>

<p align="center">
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

...

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
