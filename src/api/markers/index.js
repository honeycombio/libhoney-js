export class Marker {
  constructor(message, type, url) {
    this.message = message;
    this.type = type;
    this.url = url;
  }

  static fromJSON(m) {
    return new Marker(m.message, m.type, m.url);
  }
}

export function marker({ message, type, url }) {
  return new Marker(message, type, url);
}
