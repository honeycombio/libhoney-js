/* eslint-env node, jest */
import { MockTransmission } from "../transmission";
import libhoney from "../libhoney";

import superagent from "superagent";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mock = require("superagent-mocker")(superagent);

describe("libhoney", () => {
  describe("constructor options", () => {
    describe.each(["mock", MockTransmission])(
      "with %p transmission",
      transmissionSpec => {
        it("should be communicated to transmission constructor", () => {
          const options = {
            a: 1,
            b: 2,
            c: 3,
            d: 4,
            transmission: transmissionSpec
          };

          const honey = new libhoney(options);

          const transmission = honey.transmission as MockTransmission;

          expect(options.a).toEqual(transmission.constructorArg.a);
          expect(options.b).toEqual(transmission.constructorArg.b);
          expect(options.c).toEqual(transmission.constructorArg.c);
          expect(options.d).toEqual(transmission.constructorArg.d);
        });
      }
    );
  });

  describe("event properties", () => {
    it("should ultimately fallback to hardcoded defaults", () => {
      const honey = new libhoney({
        // these two properties are required
        writeKey: "12345",
        dataset: "testing",
        transmission: "mock"
      });
      const transmission = honey.transmission as MockTransmission;
      const postData = { a: 1, b: 2 };
      honey.sendNow(postData);

      expect(transmission.events).toHaveLength(1);
      expect(transmission.events[0].apiHost).toEqual(
        "https://api.honeycomb.io/"
      );
      expect(transmission.events[0].writeKey).toEqual("12345");

      expect(transmission.events[0].dataset).toEqual("testing");
      expect(transmission.events[0].sampleRate).toEqual(1);
      expect(transmission.events[0].timestamp).toBeInstanceOf(Date);
      expect(transmission.events[0].postData).toEqual(postData);
    });

    it("should come from libhoney options if not specified in event", () => {
      const honey = new libhoney({
        apiHost: "http://foo/bar",
        writeKey: "12345",
        dataset: "testing",
        transmission: "mock"
      });
      const transmission = honey.transmission as MockTransmission;
      const postData = { a: 1, b: 2 };
      honey.sendNow(postData);

      expect(transmission.events).toHaveLength(1);
      expect(transmission.events[0].apiHost).toEqual("http://foo/bar");
      expect(transmission.events[0].writeKey).toEqual("12345");
      expect(transmission.events[0].dataset).toEqual("testing");
      expect(transmission.events[0].postData).toEqual(postData);
    });
  });

  describe("response queue", () => {
    it("should enqueue a maximum of maxResponseQueueSize, dropping new responses (not old)", done => {
      mock.post("http://localhost:9999/1/events/testResponseQueue", _req => {
        return {};
      });

      const queueSize = 50;
      let queueFullCount = 0;
      const honey = new libhoney({
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

      for (let i = 0; i < queueSize + 1; i++) {
        const ev = honey.newEvent();
        ev.add({ a: 1, b: 2 });
        ev.addMetadata(i);
        ev.send();
      }
    });
  });

  describe("disabled = true", () => {
    it("should not hit transmission", () => {
      const honey = new libhoney({
        // these two properties are required
        writeKey: "12345",
        dataset: "testing",
        transmission: "mock",
        disabled: true
      });
      const transmission = honey.transmission;

      expect(transmission).toBe(null);
    });
  });
});
