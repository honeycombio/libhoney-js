/* global describe, it, require */
import assert from "assert";
import libhoney from "../libhoney";

let superagent = require("superagent");
let mock = require("superagent-mocker")(superagent);

describe("libhoney", function() {
  describe("constructor options", function() {
    it("should be communicated to transmission constructor", function() {
      var options = { a: 1, b: 2, c: 3, d: 4, transmission: "mock" };

      let honey = new libhoney(options);

      let transmission = honey.transmission;

      assert.equal(options.a, transmission.constructorArg.a);
      assert.equal(options.b, transmission.constructorArg.b);
      assert.equal(options.c, transmission.constructorArg.c);
      assert.equal(options.d, transmission.constructorArg.d);
    });
  });

  describe("event properties", function() {
    it("should ultimately fallback to hardcoded defaults", function() {
      var honey = new libhoney({
        // these two properties are required
        writeKey: "12345",
        dataset: "testing",
        transmission: "mock"
      });
      let transmission = honey.transmission;
      var postData = { a: 1, b: 2 };
      honey.sendNow(postData);

      assert.equal(transmission.events.length, 1);
      assert.equal(transmission.events[0].apiHost, "https://api.honeycomb.io/");
      assert.equal(transmission.events[0].writeKey, "12345");

      assert.equal(transmission.events[0].dataset, "testing");
      assert.equal(transmission.events[0].sampleRate, 1);
      assert(transmission.events[0].timestamp instanceof Date);
      assert.equal(transmission.events[0].postData, JSON.stringify(postData));
    });

    it("should come from libhoney options if not specified in event", function() {
      var honey = new libhoney({
        apiHost: "http://foo/bar",
        writeKey: "12345",
        dataset: "testing",
        transmission: "mock"
      });
      let transmission = honey.transmission;
      var postData = { a: 1, b: 2 };
      honey.sendNow(postData);

      assert.equal(transmission.events.length, 1);
      assert.equal(transmission.events[0].apiHost, "http://foo/bar");
      assert.equal(transmission.events[0].writeKey, "12345");
      assert.equal(transmission.events[0].dataset, "testing");
      assert.equal(transmission.events[0].postData, JSON.stringify(postData));
    });
  });

  describe("response queue", function() {
    it("should enqueue a maximum of maxResponseQueueSize, dropping new responses (not old)", function(done) {
      mock.post("http://localhost:9999/1/events/testResponseQueue", function(
        _req
      ) {
        return {};
      });

      var queueSize = 50;
      var queueFullCount = 0;
      var honey = new libhoney({
        apiHost: "http://localhost:9999",
        writeKey: "12345",
        dataset: "testResponseQueue",
        maxResponseQueueSize: queueSize
      });

      // we send queueSize+1 events, so we should see two response events
      // with queueSize as the length
      honey.on("response", queue => {
        if (queue.length !== queueSize) {
          return;
        }

        queueFullCount++;
        if (queueFullCount === 2) {
          queue.sort((a, b) => a.metadata - b.metadata);
          assert.equal(queue[0].metadata, 0);
          assert.equal(queue[queueSize - 1].metadata, queueSize - 1);
          done();
        }
      });

      for (var i = 0; i < queueSize + 1; i++) {
        var ev = honey.newEvent();
        ev.add({ a: 1, b: 2 });
        ev.addMetadata(i);
        ev.send();
      }
    });
  });

  describe("disabled = true", function() {
    it("should not hit transmission", function() {
      var honey = new libhoney({
        // these two properties are required
        writeKey: "12345",
        dataset: "testing",
        transmission: "mock",
        disabled: true
      });
      var transmission = honey.transmission;

      assert.equal(transmission, null);
    });
  });
});
