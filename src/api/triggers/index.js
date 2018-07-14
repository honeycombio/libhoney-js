import { Query } from "../queries";

export const valieThresholdOps = {
  ">": true,
  ">=": true,
  "<": true,
  "<=": true
};

export class Trigger {
  constructor(name, description, frequency, query, threshold, recipients, id) {
    // validate here
    this.name = name;
    this.description = description;
    this.frequency = frequency;
    this.query = query;
    this.threshold = threshold;
    this.recipients = recipients;
    this.id = id;
  }

  static fromJSON(t) {
    return new Trigger(
      t.name,
      t.description,
      t.frequency,
      Query.fromJSON(t.query),
      Threshold.fromJSON(t.threshold),
      (t.recipients || []).map(r => Recipient.fromJSON(r)),
      b.id
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
    query,
    threshold,
    recipients
  );
}

export class Threshold {
  constructor(op, value) {
    // validate here
    this.op = op;
    this.value = value;
  }
  static fromJSON(t) {
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
    // validate here
    this.type = type;
    this.target = target;
  }
  static fromJSON(r) {
    return new Recipient(r.type, r.target);
  }
}
export function recipient({ type, target }) {
  return new Recipient(type, target);
}
recipient.slack = target => new Recipient("slack", target);
recipient.email = target => new Recipient("email", target);
recipient.pagerduty = () => new Recipient("pagerduty");

// example

let t1 = trigger({
  name: "Test Trigger",
  description: "Trigger Description",
  frequency: 120, // every 2 minutes
  query: query({
    calculations: [calculation.COUNT()]
  }),
  threshold: threshold.gt(500),
  recipients: [recipient.email("toshok@honeycomb.io")]
});
