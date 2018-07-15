/* global describe, expect */
import cases from "jest-in-case";

import { calculation, order } from ".";

describe("orders", () => {
  cases(
    "order validation failures",
    opts => {
      expect(() => order(opts.args)).toThrowError(Error, opts.throws);
    },
    [
      {
        name: "undefined column",
        args: {
          op: "P99",
          order: "descending"
        },
        throws: "column field is required"
      },
      {
        name: "empty column",
        args: {
          op: "P99",
          column: "",
          order: "descending"
        },
        throws: "column field is required"
      }
    ]
  );
});

describe("calculations", () => {
  cases(
    "calculation validation failures",
    opts => {
      expect(() => calculation(opts.args)).toThrowError(Error, opts.throws);
    },
    [
      {
        name: "undefined column",
        args: {
          op: "P99"
        },
        throws: "column field is required"
      },
      {
        name: "empty column",
        args: {
          op: "P99",
          column: ""
        },
        throws: "column field is required"
      },

      {
        name: "undefined op",
        args: {
          column: "col"
        },
        throws: "op field is required"
      },
      {
        name: "empty op",
        args: {
          op: "",
          column: "col"
        },
        throws: "op field is required"
      },

      {
        name: "unknown op",
        args: {
          op: "SomethingSilly",
          column: "col"
        },
        throws: "unknown calculation op 'SomethingSilly'"
      }
    ]
  );

  // XXX(toshok) success
});
