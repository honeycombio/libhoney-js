/* eslint-env node, jest */
import libhoney from "../libhoney";

let superagent = require("superagent");
let mock = require("superagent-mocker")(superagent);

describe("libhoney", function() {
  describe("constructor options", function() {
    it("should be communicated to transmission constructor", function() {
      var options = { a: 1, b: 2, c: 3, d: 4, transmission: "mock" };

      let honey = new libhoney(options);

      let transmission = honey.transmission;

      expect(options.a).toEqual(transmission.constructorArg.a);
      expect(options.b).toEqual(transmission.constructorArg.b);
      expect(options.c).toEqual(transmission.constructorArg.c);
      expect(options.d).toEqual(transmission.constructorArg.d);
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

      expect(transmission.events).toHaveLength(1);
      expect(transmission.events[0].apiHost).toEqual(
        "https://api.honeycomb.io/"
      );
      expect(transmission.events[0].writeKey).toEqual("12345");

      expect(transmission.events[0].dataset).toEqual("testing");
      expect(transmission.events[0].sampleRate).toEqual(1);
      expect(transmission.events[0].timestamp).toBeInstanceOf(Date);
      expect(transmission.events[0].postData).toEqual(JSON.stringify(postData));
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

      expect(transmission.events).toHaveLength(1);
      expect(transmission.events[0].apiHost).toEqual("http://foo/bar");
      expect(transmission.events[0].writeKey).toEqual("12345");
      expect(transmission.events[0].dataset).toEqual("testing");
      expect(transmission.events[0].postData).toEqual(JSON.stringify(postData));
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
          expect(queue[0].metadata).toEqual(0);
          expect(queue[queueSize - 1].metadata).toEqual(queueSize - 1);
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

      expect(transmission).toBe(null);
    });
  });
});
