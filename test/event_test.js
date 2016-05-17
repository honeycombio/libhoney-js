import assert from 'assert';
import libhoney from '../lib/libhoney';

describe('libhoney events', function() {
  var hny = new libhoney();
  
  it("inherit fields and dyn_fields from builder", function() {
    var b = hny.newBuilder({a : 5}, {b: function() { return 3; }});

    var ev = b.newEvent();
    assert.equal(5, ev.data.a);
    assert.equal(3, ev.data.b);
  });

  it("accepts dict-like arguments to .add()", function() {
    var b = hny.newBuilder();
    var ev = b.newEvent();

    ev.add({ a: 5 });
    assert.equal(5, ev.data.a);

    var ev2 = b.newEvent();
    var map = new Map();
    map.set("a", 5);
    assert.equal(5, ev.data.a);
  });

  it("it toString()'s keys from Maps in .add()", function() {
    var b = hny.newBuilder();
    var ev = b.newEvent();

    var map = new Map();
    map.set({ toString: function() { return "hello"; } }, 5);
    ev.add(map);

    assert.equal(5, ev.data.hello);
  });

  it("converts all values to primitive types in .add/.addField", function() {
    var b = hny.newBuilder();
    var ev;
    var map;

    ev = b.newEvent();
    map = new Map();
    
    // Object, we JSON.stringify it
    map.set("obj", { a: 1, b : 2 });

    // String converts to a string
    map.set("String", new String("a:1"));
    map.set("string", "a:1");

    // Number converts to a number
    map.set("Number", new Number(5));
    map.set("number", 5);

    // Boolean converts to a boolean
    map.set("Boolean", new Boolean(true));
    map.set("boolean", true);

    // Date does not convert
    map.set("Date", new Date(1,2,3,4,5,6,7));

    // Null/undefined both end up being null in the output
    map.set("null", null);
    map.set("undefined", undefined);
    
    ev.add(map);
    assert.equal(JSON.stringify(ev.data), '{"obj":\"{\\"a\\":1,\\"b\\":2}\","String":"a:1","string":"a:1","Number":5,"number":5,"Boolean":true,"boolean":true,"Date":"1901-03-03T12:05:06.007Z","null":null,"undefined":null}');
  });
});
