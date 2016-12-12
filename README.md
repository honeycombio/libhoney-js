A JS library for sending data to Honeycomb (https://honeycomb.io)
=================================================================

[![Build Status](https://travis-ci.org/honeycombio/libhoney-js.svg?branch=master)](https://travis-ci.org/honeycombio/libhoney-js)

## Summary

libhoney is written to ease the process of sending data to Honeycomb from within
your js server code.

For an overview of how to use a honeycomb library, see our documentation at
https://honeycomb.io/docs/send-data/sdks/

Do NOT use this in your browser-side JS.  Honeycomb uses write keys as auth tokens for sending data,
and they are not per-site keys.  If someone has your write key they can write whatever they want to
whatever dataset they want.  Don't do this.

## Documentation

An API reference is available at https://honeycombio.github.io/libhoney-js/

## Example

See the `examples/` directory for sample code demonstrating how to use events,
builders, fields, and dynamic fields.

## Contributions

Features, bug fixes and other changes to libhoney are gladly accepted. Please
open issues or a pull request with your change. Remember to add your name to the
CONTRIBUTORS file!

All contributions will be released under the Apache License 2.0.

