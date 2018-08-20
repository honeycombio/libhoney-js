import { Query } from "../queries";

export class BoardQuery {
  constructor(name, description, dataset, query) {
    this.name = name;
    this.description = description;
    this.dataset = dataset;
    this.query = query;
  }

  static fromJSON(bq) {
    if (typeof bq === "undefined") {
      return bq;
    }
    return new BoardQuery(
      bq.name,
      bq.description,
      bq.dataset,
      Query.fromJSON(bq.query)
    );
  }
}
export function boardQuery({ name, description, dataset, query }) {
  return new BoardQuery(name, description, dataset, Query.fromJSON(query));
}

export class Board {
  constructor(name, description, queries, id) {
    this.name = name;
    this.description = description;
    this.queries = queries;
    this.id = id;
  }

  static fromJSON(b) {
    return new Board(
      b.name,
      b.description,
      (b.queries || []).map(bq => BoardQuery.fromJSON(bq)),
      b.id
    );
  }
}
export function board({ name, description, queries }) {
  return new Board(
    name,
    description,
    (queries || []).map(bq => BoardQuery.fromJSON(bq))
  );
}
