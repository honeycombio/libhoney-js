/* global describe, it */
import assert from "assert";
import libhoney from "./libhoney";

describe("libhoney builder", function() {
  var hny = new libhoney();

  it("takes fields and dynamic fields in ctor", function() {
    var b = hny.newBuilder(
      { a: 5 },
      {
        b: function() {
          return 3;
        }
      }
    );
    assert.equal(5, b._fields.a);
    assert.equal(undefined, b._fields.b);
    b = hny.newBuilder();
    assert.equal(0, Object.getOwnPropertyNames(b._fields).length);
    assert.equal(0, Object.getOwnPropertyNames(b._dyn_fields).length);
  });

  it("accepts dict-like arguments to .add()", function() {
    var b;
    var ev;

    b = hny.newBuilder();
    b.add({ a: 5 });
    ev = b.newEvent();
    assert.equal(5, ev.data.a);

    var map = new Map();
    map.set("a", 5);
    b = hny.newBuilder();
    b.add(map);
    ev = b.newEvent();
    assert.equal(5, ev.data.a);
  });

  it("doesn't stringify object values", function() {
    var honey = new libhoney({
      apiHost: "http://foo/bar",
      writeKey: "12345",
      dataset: "testing",
      transmission: "mock"
    });
    var transmission = honey.transmission;

    var postData = { a: { b: 1 }, c: { d: 2 } };

    var builder = honey.newBuilder({ a: { b: 1 } });

    builder.sendNow({ c: { d: 2 } });

    assert.equal(transmission.events.length, 1);
    assert.equal(transmission.events[0].postData, JSON.stringify(postData));
  });

  it("includes snapshot of global fields/dyn_fields", function() {
    var honey = new libhoney({
      apiHost: "http://foo/bar",
      writeKey: "12345",
      dataset: "testing",
      transmission: "mock"
    });
    var transmission = honey.transmission;

    var postData = { b: 2, c: 3 };

    var builder = honey.newBuilder({ b: 2 });

    // add a global field *after* creating the builder.  it shouldn't show up in the post data
    honey.addField("a", 1);

    builder.sendNow({ c: 3 });

    assert.equal(transmission.events.length, 1);
    assert.equal(transmission.events[0].postData, JSON.stringify(postData));

    // but if we create another builder, it should show up in the post data.
    postData = { a: 1, b: 2, c: 3 };

    builder = honey.newBuilder({ b: 2 });

    builder.sendNow({ c: 3 });

    assert.equal(transmission.events.length, 2);
    assert.equal(transmission.events[1].postData, JSON.stringify(postData));
  });
});
