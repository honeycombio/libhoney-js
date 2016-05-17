import assert from 'assert';
import libhoney from '../lib/libhoney';

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
});
