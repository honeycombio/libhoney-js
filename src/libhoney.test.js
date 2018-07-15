/* global expect, describe, it, require */
import libhoney from "./libhoney";

let superagent = require("superagent");
let mock = require("superagent-mocker")(superagent);

describe("libhoney", function() {
  describe("constructor options", function() {
    it("should be communicated to event transmission constructor", function() {
      let options = { a: 1, b: 2, c: 3, d: 4 };

      let honey = new libhoney(
        Object.assign({}, options, { transmission: "mock" })
      );

      let transmission = honey.events.transmission;

      expect(transmission.constructorArg).toMatchObject(options);
    });
  });

  describe("event properties", function() {
    it("should ultimately fallback to hardcoded defaults", function() {
      let honey = new libhoney({
        // these two properties are required
        apiKey: "12345",
        dataset: "testing",
        transmission: "mock"
      });
      let transmission = honey.events.transmission;
      let postData = { a: 1, b: 2 };
      honey.events.sendNow(postData);

      expect(transmission.events).toMatchObject([
        {
          apiHost: "https://api.honeycomb.io/",
          apiKey: "12345",
          dataset: "testing",
          sampleRate: 1,
          postData: JSON.stringify(postData),
          timestamp: expect.any(Date)
        }
      ]);
    });

    it("should come from libhoney options if not specified in event", function() {
      let honey = new libhoney({
        apiHost: "http://foo/bar",
        apiKey: "12345",
        dataset: "testing",
        transmission: "mock"
      });
      let transmission = honey.events.transmission;
      let postData = { a: 1, b: 2 };
      honey.events.sendNow(postData);

      expect(transmission.events).toMatchObject([
        {
          apiHost: "http://foo/bar",
          apiKey: "12345",
          dataset: "testing",
          postData: JSON.stringify(postData)
        }
      ]);
    });
  });

  describe("response queue", function() {
    it("should enqueue a maximum of maxResponseQueueSize, dropping new responses (not old)", function(done) {
      mock.post("http://localhost:9999/1/events/testResponseQueue", function(
        req
      ) {
        return {};
      });

      let queueSize = 50;
      let queueFullCount = 0;
      let honey = new libhoney({
        apiHost: "http://localhost:9999",
        apiKey: "12345",
        dataset: "testResponseQueue",
        maxResponseQueueSize: queueSize
      });

      // we send queueSize+1 events, so we should see two response events with queueSize as the length
      honey.events.on("response", queue => {
        if (queue.length !== queueSize) {
          return;
        }

        queueFullCount++;
        if (queueFullCount === 2) {
          queue.sort((a, b) => a.metadata - b.metadata);
          expect(queue[0].metadata).toBe(0);
          expect(queue[queueSize - 1].metadata).toBe(queueSize - 1);
          done();
        }
      });

      for (let i = 0; i < queueSize + 1; i++) {
        let ev = honey.events.newEvent();
        ev.add({ a: 1, b: 2 });
        ev.addMetadata(i);
        ev.send();
      }
    });
  });

  describe("disabled = true", function() {
    it("should not hit transmission", function() {
      let honey = new libhoney({
        // these two properties are required
        apiKey: "12345",
        dataset: "testing",
        transmission: "mock",
        disabled: true
      });
      let transmission = honey.events.transmission;

      expect(transmission).toBeNull();
    });
  });
});
