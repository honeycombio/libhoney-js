import { ifThrow } from "../util";

const validFilterOps = {
  "=": true,
  "!=": true,
  ">": true,
  ">=": true,
  "<": true,
  "<=": true,
  "starts-with": true,
  "does-not-start-with": true,
  exists: true,
  "does-not-exist": true,
  contains: true,
  "does-not-contain": true
};

export const unaryFilterOps = {
  exists: true,
  "does-not-exist": true
};

export const validCalculateOps = {
  NONE: true,
  COUNT: true,
  SUM: true,
  AVG: true,
  COUNT_DISTINCT: true,
  MAX: true,
  MIN: true,
  P001: true,
  P01: true,
  P05: true,
  P10: true,
  P25: true,
  P50: true,
  P75: true,
  P90: true,
  P95: true,
  P99: true,
  P999: true,
  HEATMAP: true
};

export class Calculation {
  constructor(column, op) {
    this.column = column;
    this.op = op;
    if (this.op === "COUNT") {
      this.column = "*";
    }
    this.validate();
  }

  validate() {
    // XXX(toshok) more here
    ifThrow(!this.column, "column field is required");
    ifThrow(!this.op, "op field is required");
    ifThrow(!validCalculateOps[this.op], `unknown calculation op '${this.op}'`);
  }

  static fromJSON(c) {
    return new Calculation(c.column, c.op);
  }
}
export function calculation({ column, op }) {
  return new Calculation(column, op);
}
Object.keys(validCalculateOps).forEach(op => {
  calculation[op] = col => new Calculation(col, op);
});

export class Filter {
  constructor(column, op, value) {
    this.column = column;
    this.op = op;
    this.value = value;
    this.validate();
  }

  validate() {
    // XXX(toshok) more here
  }
  static fromJSON(f) {
    return new Filter(f.column, f.op, f.value);
  }
}
export function filter({ column, op, value }) {
  return new Filter(column, op, value);
}

export class Order {
  constructor(column, op, order = "ascending") {
    this.column = column;
    this.op = op;
    this.order = order;

    if (this.op === "COUNT") {
      this.column = "*";
    }

    this.validate();
  }

  validate() {
    ifThrow(!this.column, "column field is required");
    ifThrow(!this.op, "op field is required");
    ifThrow(!validCalculateOps[this.op], `unknown order op '${this.op}'`);
    ifThrow(
      this.order !== "ascending" && this.order !== "descending",
      `unknown order '${this.order}'`
    );
  }

  ascending() {
    this.order = "ascending";
    return this;
  }

  descending() {
    this.order = "descending";
    return this;
  }

  static fromJSON(o) {
    return new Order(o.column, o.op, o.order);
  }
}
export function order({ column, op, order }) {
  return new Order(column, op, order);
}
Object.keys(validCalculateOps).forEach(op => {
  order[op] = col => new Order(col, op);
});

export class Query {
  constructor(
    breakdowns = [],
    calculations = [],
    filters = [],
    filterCombination,
    orders = [],
    limit,
    startTime,
    endTime,
    timeRange,
    granularity
  ) {
    this.breakdowns = breakdowns;
    this.calculations = calculations;
    this.filters = filters;
    this.filterCombination = filterCombination;
    this.orders = orders;
    this.limit = limit;
    this.startTime = startTime;
    this.endTime = endTime;
    this.timeRange = timeRange;
    this.granularity = granularity;

    this.validate();
  }

  validate() {
    // XXX(toshok) more here
  }

  static fromJSON(q) {
    if (typeof q === "undefined") {
      return q;
    }
    return new Query(
      q.breakdowns || [],
      (q.calculations || []).map(c => Calculation.fromJSON(c)),
      (q.filter || []).map(f => Filter.fromJSON(f)),
      q.filterCombination,
      (q.orders || []).map(o => Order.fromJSON(o)),
      q.limit,
      q.startTime,
      q.endTime,
      q.timeRange,
      q.granularity
    );
  }
}

export function query({
  breakdowns,
  calculations,
  filters,
  filterCombination = "AND",
  orders,
  limit,
  startTime,
  endTime,
  timeRange,
  granularity
}) {
  return new Query(
    breakdowns,
    calculations,
    filters,
    filterCombination,
    orders,
    limit,
    startTime,
    endTime,
    timeRange,
    granularity
  );
}
