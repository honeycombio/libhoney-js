/* eslint-env node */
import commonjs from "rollup-plugin-commonjs";
import json from "rollup-plugin-json";
import pkg from "./package.json";
import replace from "rollup-plugin-replace";
import resolve from "rollup-plugin-node-resolve";
import typescript from "rollup-plugin-typescript2";

export default {
  input: "src/libhoney.ts",
  external: ["superagent", "events", "path", "url", "superagent-proxy"],

  plugins: [
    resolve(),
    commonjs(),
    typescript({
      typescript: require("typescript")
    }),
    json(),
    replace({
      delimiters: ["<@", "@>"],
      LIBHONEY_JS_VERSION: pkg.version
    })
  ],

  output: [
    { file: pkg.main, format: "cjs" },
    { file: pkg.module, format: "es" }
  ]
};
