export class Dataset {
  constructor(name, slug) {
    this.name = name;
    this.slug = slug;
  }

  static fromJSON(d) {
    return new Dataset(d.name, d.slug);
  }
}

export function dataset({ name, slug }) {
  return new Dataset(name, slug);
}
