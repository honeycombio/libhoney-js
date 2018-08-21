/* eslint-env node */
const resolve = require("rollup-plugin-node-resolve");
const commonjs = require("rollup-plugin-commonjs");
const replace = require("rollup-plugin-replace");
const pkg = require("./package.json");

module.exports = {
  input: "src/libhoney.js",
  external: ["superagent", "events", "path", "url"],

  plugins: [
    resolve(),
    commonjs(),
    replace({
      delimiters: ["<@", "@>"],
      LIBHONEY_JS_VERSION: pkg.version
    })
  ],

  output: [
    { file: "dist/libhoney.cjs.js", format: "cjs" },
    { file: "dist/libhoney.es.js", format: "es" }
  ]
};
