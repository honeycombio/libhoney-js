import { Query } from "../queries";

export class BoardQuery {
  constructor(name, description, dataset, query) {
    // validate here
    this.name = name;
    this.description = description;
    this.dataset = dataset;
    this.query = query;
  }
}
export function boardQuery({ name, description, dataset, query }) {
  return new BoardQuery(name, description, dataset, query);
}

export class Board {
  constructor(name, description, queries, id) {
    // validate here
    this.name = name;
    this.description = description;
    this.queries = queries;
    this.id = id;
  }

  static fromJSON(b) {
    return new Board(
      b.name,
      b.description,
      (b.queries || []).map(q => Query.fromJSON(q)),
      b.id
    );
  }
}
export function board({ name, description, queries }) {
  return new Board(name, description, queries);
}

// example
/*
let b1 = board({
  name: "Example Board",
  description: "Just testing out the API",
  queries: [
    boardQuery({
      name: "Example query",
      description: "Query Description",
      dataset: "My Service",
      query: query({
        breakdowns: ["col1", "col2"],
        calculations: [
          calculation.COUNT(),
          calculation.P99("col1"),
          calculation.P50("col2")
        ],
        orders: [order.P99("col1"), order.P50("col2").descending()]
      })
    })
  ]
});

console.log(b1);
*/
