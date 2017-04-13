# libhoney [![Build Status](https://travis-ci.org/honeycombio/libhoney-js.svg?branch=master)](https://travis-ci.org/honeycombio/libhoney-js) [![npm version](https://badge.fury.io/js/libhoney.svg)](https://badge.fury.io/js/libhoney.svg)

A node module for interacting with [Honeycomb](https://honeycomb.io). (For more information, see the [documentation](https://honeycomb.io/docs/) and [JavaScript SDK guide](https://honeycomb.io/docs/connect/javascript).)

**NOT** for use in browser-side JavaScript applications. Write keys are your auth tokens for sending data to Honeycomb and should be kept secure -- they're not per-site keys. Don't leave yourself vulnerable to malicious users.

## Installation

```
npm install libhoney --save-dev
```

## Documentation

An API reference is available at https://honeycombio.github.io/libhoney-js/

## Example

Honeycomb can calculate all sorts of statistics, so send the values you care about and let us crunch the averages, percentiles, lower/upper bounds, cardinality -- whatever you want -- for you.

```js
var libhoney = require('libhoney').default;

var hny = new libhoney({
  writeKey: "YOUR_WRITE_KEY",
  dataset: "honeycomb-js-example"
});

hny.sendNow({
  message: "Test Honeycomb event",
  randomFloat: Math.random(),
  hostname: os.hostname(),
  favoriteColor: "chartreuse"
});
```

For more, see the [`examples/`](examples/) directory for sample code demonstrating how to use events,
builders, fields, and dynamic fields in an Express app.

## Contributions

Features, bug fixes and other changes to libhoney are gladly accepted. Please
open issues or a pull request with your change. Remember to add your name to the
CONTRIBUTORS file!

All contributions will be released under the Apache License 2.0.
