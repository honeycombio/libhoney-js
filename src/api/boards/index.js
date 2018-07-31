import { Query } from "../queries";
import { ifThrow } from "../util";

export class BoardQuery {
  constructor(name, description, dataset, query) {
    this.name = name;
    this.description = description;
    this.dataset = dataset;
    this.query = query;

    this.validate();
  }

  validate() {
    ifThrow(!this.dataset, "dataset must have at least one character");

    if (this.query) {
      this.query.validate();
    }
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

    this.validate();
  }

  validate() {
    //    ifThrow(!this.name, "name must have at least one character");

    if (this.queries) {
      this.queries.forEach(bq => bq.validate());
    }
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
