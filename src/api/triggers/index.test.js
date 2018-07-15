/* global describe, expect */
import cases from "jest-in-case";

import { trigger, threshold, recipient } from ".";
import { calculation, order } from "../queries";

describe("triggers", () => {
  cases(
    "name validation failures",
    opts => {
      expect(() => trigger(opts.args)).toThrowError(Error, opts.throws);
    },
    [
      {
        name: "undefined",
        args: {
          name: undefined
        },
        throws: "name must have a least one character"
      },
      {
        name: "empty",
        args: {
          name: ""
        },
        throws: "name must have a least one character"
      }
    ]
  );

  cases(
    "frequency validation failures",
    opts => {
      expect(() => trigger(opts.args)).toThrowError(Error, opts.throws);
    },
    [
      {
        name: "too short",
        args: {
          name: "valid name",
          frequency: 40
        },
        throws: "frequency must be at least one minute"
      },
      {
        name: "too long",
        args: {
          name: "valid name",
          frequency: 86401
        },
        throws: "frequency may not be longer than one day"
      },
      {
        name: "not a multiple of 60",
        args: {
          name: "valid name",
          frequency: 130
        },
        throws: "frequency must be a multiple of 60"
      }
    ]
  );

  cases(
    "query validation failures",
    opts => {
      expect(() => trigger(opts.args)).toThrowError(Error, opts.throws);
    },
    [
      {
        name: "lacking calculations",
        args: {
          name: "valid name",
          frequency: 120,
          query: {}
        },
        throws: "trigger query requires exactly one calculation"
      },
      {
        name: "empty calculations",
        args: {
          name: "valid name",
          frequency: 120,
          query: {
            calculations: []
          }
        },
        throws: "trigger query requires exactly one calculation"
      },
      {
        name: "two calculations",
        args: {
          name: "valid name",
          frequency: 120,
          query: {
            calculations: [calculation.COUNT(), calculation.P99("col2")]
          }
        },
        throws: "trigger query requires exactly one calculation"
      },
      {
        name: "an order present",
        args: {
          name: "valid name",
          frequency: 120,
          query: {
            calculations: [calculation.COUNT()],
            orders: [order.COUNT().descending()]
          }
        },
        throws: "order field not allowed for trigger queries"
      },
      {
        name: "a limit present",
        args: {
          name: "valid name",
          frequency: 120,
          query: {
            calculations: [calculation.COUNT()],
            orders: [],
            limit: 50
          }
        },
        throws: "limit field not allowed for trigger query"
      }

      // XXX startTime, endTime, timeRange, granularity
    ]
  );

  cases(
    "threshold validation failures",
    opts => {
      expect(() => trigger(opts.args)).toThrowError(Error, opts.throws);
    },
    [
      {
        name: "no threshold",
        args: {
          name: "valid name",
          frequency: 120,
          query: {
            calculations: [calculation.COUNT()]
          }
        },
        throws: "threshold field is required"
      }
    ]
  );

  cases(
    "recipient validation failures",
    opts => {
      if (opts.throws) {
        expect(() => trigger(opts.args)).toThrowError(Error, opts.throws);
      } else {
        // we should actually check the values got there, right?
        expect(trigger(opts.args)).not.toBeUndefined();
      }
    },
    [
      {
        name: "duplicate recipients",
        args: {
          name: "valid name",
          frequency: 120,
          query: {
            calculations: [calculation.COUNT()]
          },
          threshold: { op: ">", value: 100 },
          recipients: [
            { type: "email", target: "robot@acme.org" },
            { type: "email", target: "robot@acme.org" }
          ]
        },
        throws: "duplicate recipient"
      }
    ]
  );

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
    "treshold validation failures",
    opts => {
      expect(() => threshold(opts.args)).toThrowError(Error, opts.throws);
    },
    [
      {
        name: "undefined op",
        args: {
          value: 100
        },
        throws: "threshold requires an op"
      },
      {
        name: "empty op",
        args: {
          op: "",
          value: 100
        },
        throws: "threshold requires an op"
      },
      {
        name: "undefined value",
        args: {
          op: "<"
        },
        throws: "threshold requires a value"
      },
      {
        name: "unrecognized op",
        args: {
          op: "<=>",
          value: 100
        },
        throws: "unknown threshold op '<=>'"
      }
    ]
  );

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
    "recipient validation failures",
    opts => {
      expect(() => recipient(opts.args)).toThrowError(Error, opts.throws);
    },
    [
      {
        name: "undefined type",
        args: {
          target: "robot@acme.org"
        },
        throws: "recipients require a type"
      },
      {
        name: "empty type",
        args: {
          type: "",
          target: "robot@acme.org"
        },
        throws: "recipients require a type"
      },
      {
        name: "undefined email target",
        args: {
          type: "email"
        },
        throws: "recipient type email requires a target"
      },
      {
        name: "empty email target",
        args: {
          type: "email",
          target: ""
        },
        throws: "recipient type email requires a target"
      },
      {
        name: "undefined pagerduty target",
        args: {
          type: "pagerduty"
        },
        throws: "recipient type pagerduty requires a target"
      },
      {
        name: "empty pagerduty target",
        args: {
          type: "pagerduty",
          target: ""
        },
        throws: "recipient type pagerduty requires a target"
      },
      {
        name: "unknown recipient type",
        args: {
          type: "whoknows?",
          target: ""
        },
        throws: "unknown recipient type 'whoknows?'"
      }
    ]
  );

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
