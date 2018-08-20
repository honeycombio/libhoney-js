/* eslint-env node, jest */
import cases from "jest-in-case";

import { trigger, threshold, recipient } from ".";

describe("triggers", () => {
  cases(
    "roundtrip success",
    opts => {
      expect(JSON.parse(JSON.stringify(trigger(opts.args)))).toEqual(
        opts.result
      );
    },
    [
      {
        name: "1",
        args: {
          name: "valid name",
          frequency: 120,
          query: {
            calculations: [{ op: "COUNT", column: "*" }]
          },
          threshold: { op: ">", value: 100 }
        },
        result: {
          name: "valid name",
          frequency: 120,
          query: {
            breakdowns: [],
            calculations: [{ op: "COUNT", column: "*" }],
            filters: [],
            orders: []
          },
          threshold: { op: ">", value: 100 },
          recipients: []
        }
      }
    ]
  );
});

describe("thresholds", () => {
  cases(
    "roundtrip success",
    opts => {
      expect(JSON.parse(JSON.stringify(threshold(opts.args)))).toEqual(
        opts.args
      );
    },
    [
      {
        name: "1",
        args: {
          op: "<",
          value: 100
        }
      }
    ]
  );
});

describe("recipients", () => {
  cases(
    "roundtrip successes",
    opts => {
      expect(JSON.parse(JSON.stringify(recipient(opts.args)))).toEqual(
        opts.args
      );
    },
    [
      {
        name: "email",
        args: {
          type: "email",
          target: "robot@acme.org"
        }
      },
      {
        name: "slack",
        args: {
          type: "slack",
          target: "#robot"
        }
      },
      {
        name: "pagerduty",
        args: {
          type: "pagerduty",
          target: "robot-pagerduty-token-goes-here"
        }
      }
    ]
  );
});
