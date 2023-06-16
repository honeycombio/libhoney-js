# libhoney

[![OSS Lifecycle](https://img.shields.io/osslifecycle/honeycombio/libhoney-js?color=success)](https://github.com/honeycombio/home/blob/main/honeycomb-oss-lifecycle-and-practices.md)
[![CircleCI](https://circleci.com/gh/honeycombio/libhoney-js.svg?style=svg&circle-token=c7056d820eeaa624756e03c3da01deab9d647663)](https://circleci.com/gh/honeycombio/libhoney-js)
[![npm version](https://badge.fury.io/js/libhoney.svg)](https://badge.fury.io/js/libhoney)

A Node.js module for sending events to [Honeycomb](https://www.honeycomb.io), a service for debugging your software in production.
For tracing support and automatic instrumentation of Express and other common libraries, check out our [Beeline for NodeJS](https://github.com/honeycombio/beeline-nodejs).

[Usage and Examples](https://docs.honeycomb.io/getting-data-in/javascript/libhoney/)

**NOTE** For use in browser-side JavaScript applications, generate an API key that has permission only to send events.

## Dependencies

**Node 14+**

## Contributions

See [DEVELOPMENT.md](./DEVELOPMENT.md)

Features, bug fixes and other changes to libhoney are gladly accepted. Please
open issues or a pull request with your change.

All contributions will be released under the Apache License 2.0.

### Releasing a new version

Use `npm version --no-git-tag-version` to update the version number using `major`, `minor`, `patch`, or the prerelease variants `premajor`, `preminor`, or `prepatch`. We use `--no-git-tag-version` to avoid automatically tagging - tagging with the version automatically triggers a CI run that publishes, and we only want to do that upon merging the PR into `main`.

After doing this, follow our usual instructions for the actual process of tagging and releasing the package.
