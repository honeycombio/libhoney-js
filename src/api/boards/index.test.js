/* global describe, expect */
import cases from "jest-in-case";

import { boardQuery, board } from ".";

describe("boards", () => {
  cases(
    "name validation failures",
    opts => {
      expect(() => board(opts.args)).toThrowError(Error, opts.throws);
    },
    [
      {
        name: "undefined name",
        args: {
          name: undefined
        },
        throws: "name must have at least one character"
      },
      {
        name: "empty name",
        args: {
          name: ""
        },
        throws: "name must have at least one character"
      }
    ]
  );

  cases(
    "roundtrip success",
    opts => {
      expect(JSON.parse(JSON.stringify(board(opts.args)))).toEqual(opts.result);
    },
    [
      {
        name: "undefined queries",
        args: {
          name: "valid name",
          description: "valid description"
        },
        result: {
          name: "valid name",
          description: "valid description",
          queries: []
        }
      },
      {
        name: "undefined queries",
        args: {
          name: "valid name",
          description: "valid description",
          queries: []
        },
        result: {
          name: "valid name",
          description: "valid description",
          queries: []
        }
      },
      {
        name: "with a query",
        args: {
          name: "valid board name",
          description: "valid board description",
          queries: [
            {
              name: "valid board query name",
              description: "valid board query description",
              dataset: "My Dataset",
              query: {
                calculations: [{ op: "COUNT", column: "*" }]
              }
            }
          ]
        },
        result: {
          name: "valid board name",
          description: "valid board description",
          queries: [
            {
              name: "valid board query name",
              description: "valid board query description",
              dataset: "My Dataset",
              query: {
                breakdowns: [],
                calculations: [{ op: "COUNT", column: "*" }],
                filters: [],
                orders: []
              }
            }
          ]
        }
      }
    ]
  );
});

describe("board queries", () => {
  cases(
    "dataset validation failures",
    opts => {
      expect(() => boardQuery(opts.args)).toThrowError(Error, opts.throws);
    },
    [
      {
        name: "undefined dataset",
        args: {
          name: "query name"
        },
        throws: "dataset must have at least one character"
      },
      {
        name: "empty dataset",
        args: {
          name: "query name",
          dataset: ""
        },
        throws: "name must have at least one character"
      }
    ]
  );

  cases(
    "roundtrip success",
    opts => {
      expect(JSON.parse(JSON.stringify(boardQuery(opts.args)))).toEqual(
        opts.result
      );
    },
    [
      {
        name: "1",
        args: {
          name: "valid name",
          description: "valid description",
          dataset: "My Dataset",
          query: {
            calculations: [{ op: "COUNT", column: "*" }]
          }
        },
        result: {
          name: "valid name",
          description: "valid description",
          dataset: "My Dataset",
          query: {
            breakdowns: [],
            calculations: [{ op: "COUNT", column: "*" }],
            filters: [],
            orders: []
          }
        }
      }
    ]
  );
});
