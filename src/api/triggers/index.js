import { Query } from "../queries";

// const validThresholdOps = {
//   ">": true,
//   ">=": true,
//   "<": true,
//   "<=": true
// };

export class Trigger {
  constructor(name, description, frequency, query, threshold, recipients, id) {
    this.name = name;
    this.description = description;
    this.frequency = frequency;
    this.query = query;
    this.threshold = threshold;
    this.recipients = recipients;
    this.id = id;
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
recipient.webhook = target => new Recipient("webhook", target);
recipient.marker = target => new Recipient("marker", target);
recipient.pagerduty = () => new Recipient("pagerduty");
