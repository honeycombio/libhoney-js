/* eslint-env node */
const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const replace = require("rollup-plugin-replace");
const json = require("rollup-plugin-json");
const pkg = require("./package.json");

module.exports = {
  input: "built/libhoney.js",
  external: ["superagent", "events", "path", "url", "superagent-proxy"],

  plugins: [
    resolve(),
    commonjs(),
    json(),
    replace({
      delimiters: ["<@", "@>"],
      LIBHONEY_JS_VERSION: pkg.version
    }),
    replace({
      "process.env.LIBHONEY_TARGET": '"browser"'
    })
  ],

  output: [{ file: pkg.browser, format: "cjs" }]
};
