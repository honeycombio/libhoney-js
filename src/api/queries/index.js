export const validFilterOps = {
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

export const validAggregateOps = {
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
    //validate here
    this.column = column;
    this.op = op;
    if (this.op === "COUNT") {
      this.column = "*";
    }
  }
}
export function calculation({ column, op }) {
  return new Calculation(column, op);
}
Object.keys(validAggregateOps).forEach(op => {
  calculation[op] = col => new Calculation(col, op);
});

export class Filter {
  constructor(column, op, value) {
    // validate here
    this.column = column;
    this.op = op;
    this.value = value;
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
    // validate here
    this.column = column;
    this.op = op;
    this.order = order;
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
function orderOp(op) {
  return;
}
Object.keys(validAggregateOps).forEach(op => {
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
    // validate here
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
  }

  static fromJSON(q) {
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
    orders
  );
}

// examples:

let q1 = query({
  breakdowns: ["col1", "col2"],
  calculations: [
    calculation.COUNT(),
    calculation.P99("col1"),
    calculation.P50("col2")
  ],
  orders: [order.P99("col1"), order.P50("col2").descending()]
});

console.dir(q1);
