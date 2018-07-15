import { Query } from "../queries";
import { ifThrow } from "../util";

const validThresholdOps = {
  ">": true,
  ">=": true,
  "<": true,
  "<=": true
};

export class Trigger {
  constructor(name, description, frequency, query, threshold, recipients, id) {
    this.name = name;
    this.description = description;
    this.frequency = frequency;
    this.query = query;
    this.threshold = threshold;
    this.recipients = recipients;
    this.id = id;

    this.validate();
  }

  validate() {
    let { name, frequency, query, threshold, recipients } = this;
    ifThrow(!name, "name must have a least one character");
    ifThrow(frequency < 60, "frequency must be at least one minute");
    ifThrow(frequency > 86400, "frequency may not be longer than one day");
    ifThrow(
      frequency && frequency % 60 != 0,
      "frequency must be a multiple of 60"
    );

    ifThrow(!query, "query field is required");
    query.validate();
    ifThrow(
      !query.calculations || query.calculations.length != 1,
      "trigger query requires exactly one calculation"
    );
    ifThrow(
      query.orders && query.orders.length > 0,
      "order field not allowed for trigger queries"
    );

    ifThrow(
      typeof query.limit !== "undefined",
      "limit field not allowed for trigger query"
    );
    ifThrow(
      typeof query.startTime !== "undefined" ||
        typeof query.endTime !== "undefined" ||
        typeof query.timeRange !== "undefined",
      "time fields not allowed for trigger queries"
    );
    ifThrow(
      typeof query.granularity !== "undefined",
      "granularity field not allowed for trigger queries"
    );

    ifThrow(!threshold, "threshold field is required");
    threshold.validate();

    if (recipients) {
      for (let i = 0, e = recipients.length; i < e; i++) {
        let recip = recipients[i];
        recip.validate();

        for (let j = i + 1; j < e; j++) {
          let cmp = recipients[j];
          // TODO(toshok) more generate deepEqual test here
          ifThrow(
            cmp.type === recip.type && cmp.target === recip.target,
            "duplicate recipient"
          );
        }
      }
    }
  }

  static fromJSON(t) {
    if (typeof t === "undefined") {
      return t;
    }
    return new Trigger(
      t.name,
      t.description,
      t.frequency,
      Query.fromJSON(t.query),
      Threshold.fromJSON(t.threshold),
      (t.recipients || []).map(r => Recipient.fromJSON(r)),
      t.id
    );
  }
}
export function trigger({
  name,
  description,
  frequency,
  query,
  threshold,
  recipients
}) {
  return new Trigger(
    name,
    description,
    frequency,
    Query.fromJSON(query),
    Threshold.fromJSON(threshold),
    (recipients || []).map(r => Recipient.fromJSON(r))
  );
}

export class Threshold {
  constructor(op, value) {
    this.op = op;
    this.value = value;

    this.validate();
  }

  validate() {
    ifThrow(!this.op, "threshold requires an op");
    ifThrow(typeof this.value === "undefined", "threshold requires a value");

    ifThrow(!validThresholdOps[this.op], `unknown threshold op '${this.op}'`);
  }

  static fromJSON(t) {
    if (typeof t === "undefined") {
      return t;
    }
    return new Threshold(t.op, t.value);
  }
}
export function threshold({ op, value }) {
  return new Threshold(op, value);
}
threshold.gt = value => new Threshold(">", value);
threshold.ge = value => new Threshold(">=", value);
threshold.lt = value => new Threshold("<", value);
threshold.le = value => new Threshold("<=", value);

export class Recipient {
  constructor(type, target) {
    this.type = type;
    this.target = target;

    this.validate();
  }

  validate() {
    ifThrow(!this.type, "recipients require a type");

    switch (this.type) {
      case "email":
        ifThrow(!this.target, "recipient type email requires a target");
        break;
      case "slack":
        // Nothing. Target isn't required and isn't validated.
        break;
      case "pagerduty":
        ifThrow(!this.target, "recipient type pagerduty cannot have a target");
        break;
      default:
        ifThrow(true, `unknown recipient type '${this.type}'`);
        break;
    }
  }

  static fromJSON(r) {
    if (typeof r === "undefined") {
      return r;
    }
    return new Recipient(r.type, r.target);
  }
}
export function recipient({ type, target }) {
  return new Recipient(type, target);
}
recipient.slack = target => new Recipient("slack", target);
recipient.email = target => new Recipient("email", target);
recipient.pagerduty = () => new Recipient("pagerduty");
