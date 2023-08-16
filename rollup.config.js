/* eslint-env node */
const { nodeResolve } = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const replace = require("@rollup/plugin-replace");
const json = require("@rollup/plugin-json");
const pkg = require("./package.json");

module.exports = {
  input: "src/libhoney.js",
  external: ["superagent", "events", "path", "url", "proxy-agent"],

  plugins: [
    nodeResolve(),
    commonjs(),
    json(),
    replace({
      delimiters: ["<@", "@>"],
      LIBHONEY_JS_VERSION: pkg.version,
    }),
    replace({
      "process.env.LIBHONEY_TARGET": '"node"',
    }),
  ],

  output: [
    { file: pkg.main, format: "cjs" },
    { file: pkg.module, format: "es" },
  ],
};
