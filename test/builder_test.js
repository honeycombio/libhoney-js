/* global describe, it */
import assert from 'assert';
import libhoney from '../lib/libhoney';

import { _transmissionSendEventArg, MockTransmission } from './mock_transmission';

describe('libhoney builder', function() {
  var hny = new libhoney();

  it("takes fields and dynamic fields in ctor", function() {
    var b = hny.newBuilder({a : 5}, {b: function() { return 3; }});
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
      transmission: MockTransmission
    });

    var postData = { c: { a: 1 } };

    var builder = honey.newBuilder();

    builder.sendNow({ c: { a: 1 } });

    assert.equal(_transmissionSendEventArg.postData, JSON.stringify(postData));
  });

  it("includes snapshot of global fields/dyn_fields", function() {
    var honey = new libhoney({
      apiHost: "http://foo/bar",
      writeKey: "12345",
      dataset: "testing",
      transmission: MockTransmission
    });

    var postData = { b : 2, c : 3 };

    var builder = honey.newBuilder({ "b": 2 });

    // add a global field *after* creating the builder.  it shouldn't show up in the post data
    honey.addField("a", 1);

    builder.sendNow({ c : 3 });

    assert.equal(_transmissionSendEventArg.postData, JSON.stringify(postData));

    // but if we create another builder, it should show up in the post data.
    postData = { a : 1, b : 2, c : 3 };

    builder = honey.newBuilder({ "b": 2 });

    builder.sendNow({ c : 3 });

    assert.equal(_transmissionSendEventArg.postData, JSON.stringify(postData));
  });
});
