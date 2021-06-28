export class QueryResult {
  constructor(result) {
    this.result = result;
  }

  static fromJSON(qr) {
    return new QueryResult(qr);
  }
}

export function queryResult(result) {
  return new QueryResult(result);
}
