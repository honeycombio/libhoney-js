export class Column {
  constructor(id, key_name, alias, hidden, description, type) {
    this.id = id;
    this.key_name = key_name;
    this.alias = alias;
    this.hidden = hidden;
    this.description = description;
    this.type = type;
  }

  static fromJSON(m) {
    return new Column(
      m.id,
      m.key_name,
      m.alias,
      m.hidden,
      m.description,
      m.type
    );
  }
}

export function column({ id, key_name, alias, hidden, description, type }) {
  return new Column(id, key_name, alias, hidden, description, type);
}
