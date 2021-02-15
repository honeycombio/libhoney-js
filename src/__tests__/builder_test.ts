/* eslint-env node, jest */
import { MockTransmission } from "../transmission";
import libhoney from "../libhoney";

describe("libhoney builder", () => {
  const hny = new libhoney({
    writeKey: "test",
    dataset: "none",
    transmission: "null"
  });

  it("takes fields and dynamic fields in ctor", () => {
    let b = hny.newBuilder(
      { a: 5 },
      {
        b: function() {
          return 3;
        }
      }
    );
    expect(b._fields["a"]).toEqual(5);
    expect(b._fields["b"]).toEqual(undefined);
    b = hny.newBuilder();
    expect(Object.getOwnPropertyNames(b._fields)).toHaveLength(0);
    expect(Object.getOwnPropertyNames(b._dynFields)).toHaveLength(0);
  });

  it("accepts dict-like arguments to .add()", () => {
    let b;
    let ev;

    b = hny.newBuilder();
    b.add({ a: 5 });
    ev = b.newEvent();
    expect(ev.data.a).toEqual(5);

    const map = new Map();
    map.set("a", 5);
    b = hny.newBuilder();
    b.add(map);
    ev = b.newEvent();
    expect(ev.data.a).toEqual(5);
  });

  it("doesn't stringify object values", () => {
    const honey = new libhoney({
      apiHost: "http://foo/bar",
      writeKey: "12345",
      dataset: "testing",
      transmission: "mock"
    });
    const transmission = honey.transmission as MockTransmission;

    const postData = { a: { b: 1 }, c: { d: 2 } };

    const builder = honey.newBuilder({ a: { b: 1 } });

    builder.sendNow({ c: { d: 2 } });

    expect(transmission.events).toHaveLength(1);
    expect(transmission.events[0].postData).toEqual(postData);
  });

  it("includes snapshot of global fields/dynFields", () => {
    const honey = new libhoney({
      apiHost: "http://foo/bar",
      writeKey: "12345",
      dataset: "testing",
      transmission: "mock"
    });
    const transmission = honey.transmission as MockTransmission;

    let postData: unknown = { b: 2, c: 3 };

    let builder = honey.newBuilder({ b: 2 });

    // add a global field *after* creating the builder.  it shouldn't show up in the post data
    honey.addField("a", 1);

    builder.sendNow({ c: 3 });

    expect(transmission.events).toHaveLength(1);
    expect(transmission.events[0].postData).toEqual(postData);

    // but if we create another builder, it should show up in the post data.
    postData = { a: 1, b: 2, c: 3 };

    builder = honey.newBuilder({ b: 2 });

    builder.sendNow({ c: 3 });

    expect(transmission.events).toHaveLength(2);
    expect(transmission.events[1].postData).toEqual(postData);
  });
});
