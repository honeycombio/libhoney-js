export class Marker {
  constructor(message, type, url) {
    this.message = message;
    this.type = type;
    this.url = url;

    this.validate();
  }

  validate() {
    // XXX(toshok) more here
  }

  static fromJSON(m) {
    return new Marker(m.message, m.type, m.url);
  }
}

export function marker({ message, type, url }) {
  return new Marker(message, type, url);
}
