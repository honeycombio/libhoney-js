# libhoney [![CircleCI](https://circleci.com/gh/honeycombio/libhoney-js.svg?style=svg&circle-token=c7056d820eeaa624756e03c3da01deab9d647663)](https://circleci.com/gh/honeycombio/libhoney-js) [![npm version](https://badge.fury.io/js/libhoney.svg)](https://badge.fury.io/js/libhoney)

A Node.js module for sending events to [Honeycomb](https://www.honeycomb.io), a service for debugging your software in production.

**NOTE** For use in browser-side JavaScript applications, generate an API key that has permission only to send events.

Requires any current LTS release of Node.js. Currently v8, and >= v10.

- [Usage and Examples](https://docs.honeycomb.io/sdk/javascript/)
- [API Reference](https://doc.esdoc.org/github.com/honeycombio/libhoney-js/)

For tracing support and automatic instrumentation of Express and other common libraries, check out our [Beeline for NodeJS](https://github.com/honeycombio/beeline-nodejs).

## Contributions

Features, bug fixes and other changes to libhoney are gladly accepted. Please
open issues or a pull request with your change. Remember to add your name to the
CONTRIBUTORS file!

All contributions will be released under the Apache License 2.0.

### Releasing a new version

Travis will automatically upload tagged releases to NPM.
