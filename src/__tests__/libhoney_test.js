/* eslint-env node, jest */
import { MockTransmission } from "../transmission";
import libhoney from "../libhoney";

let superagent = require("superagent");
let mock = require("superagent-mocker")(superagent);

describe("libhoney", () => {
  describe("constructor options", () => {
    describe.each(["mock", MockTransmission])(
      "with %p transmission",
      (transmissionSpec) => {
        it("should be communicated to transmission constructor", () => {
          const options = {
            a: 1,
            b: 2,
            c: 3,
            d: 4,
            transmission: transmissionSpec,
          };

          const honey = new libhoney(options);

          const transmission = honey.transmission;

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
      let honey = new libhoney({
        // these two properties are required
        writeKey: "12345",
        dataset: "testing",
        transmission: "mock",
      });
      let transmission = honey.transmission;
      let postData = { a: 1, b: 2 };
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
      let honey = new libhoney({
        apiHost: "http://foo/bar",
        writeKey: "12345",
        dataset: "testing",
        transmission: "mock",
      });
      let transmission = honey.transmission;
      let postData = { a: 1, b: 2 };
      honey.sendNow(postData);

      expect(transmission.events).toHaveLength(1);
      expect(transmission.events[0].apiHost).toEqual("http://foo/bar");
      expect(transmission.events[0].writeKey).toEqual("12345");
      expect(transmission.events[0].dataset).toEqual("testing");
      expect(transmission.events[0].postData).toEqual(postData);
    });

    it("should reject a send from an empty dataset with a classic key", () => {
      // mock out console.error
      console.error = jest.fn();

      let honey = new libhoney({
        apiHost: "http://foo/bar",
        writeKey: "12345678901234567890123456789012",
        dataset: "",
        transmission: "mock",
      });
      let transmission = honey.transmission;
      let postData = { a: 1, b: 2 };
      honey.sendNow(postData);

      expect(transmission.events).toHaveLength(0);
      expect(console.error.mock.calls[0][0]).toBe(
        "dataset must be a non-empty string"
      );
    });

    it("should reject a send from an empty dataset with a classic v3 key", () => {
      // mock out console.error
      console.error = jest.fn();

      const classicv3IngestKey = "hcaic_1234567890123456789012345678901234567890123456789012345678";

      let honey = new libhoney({
        apiHost: "http://foo/bar",
        writeKey: classicv3IngestKey,
        dataset: "",
        transmission: "mock",
      });
      let transmission = honey.transmission;
      let postData = { a: 1, b: 2 };
      honey.sendNow(postData);

      expect(transmission.events).toHaveLength(0);
      expect(console.error.mock.calls[0][0]).toBe(
        "dataset must be a non-empty string"
      );
    });

    it("should set an empty dataset to unknown_dataset with a V2 key", () => {
      let honey = new libhoney({
        apiHost: "http://foo/bar",
        writeKey: "aKeySimilarToOurV2Keys",
        dataset: "",
        transmission: "mock",
      });
      let transmission = honey.transmission;
      let postData = { a: 1, b: 2 };
      honey.sendNow(postData);

      expect(transmission.events).toHaveLength(1);
      expect(transmission.events[0].apiHost).toEqual("http://foo/bar");
      expect(transmission.events[0].writeKey).toEqual("aKeySimilarToOurV2Keys");
      expect(transmission.events[0].dataset).toEqual("unknown_dataset");
      expect(transmission.events[0].postData).toEqual(postData);
    });
  });

  describe("response queue", () => {
    it("should enqueue a maximum of maxResponseQueueSize, dropping new responses (not old)", (done) => {
      mock.post("http://localhost:9999/1/events/testResponseQueue", (_req) => {
        return {};
      });

      let queueSize = 50;
      let queueFullCount = 0;
      let honey = new libhoney({
        apiHost: "http://localhost:9999",
        writeKey: "12345",
        dataset: "testResponseQueue",
        maxResponseQueueSize: queueSize,
      });

      // we send queueSize+1 events, so we should see two response events
      // with queueSize as the length
      honey.on("response", (queue) => {
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
        let ev = honey.newEvent();
        ev.add({ a: 1, b: 2 });
        ev.addMetadata(i);
        ev.send();
      }
    });
  });

  describe("disabled = true", () => {
    it("should not hit transmission", async () => {
      let honey = new libhoney({
        // these two properties are required
        writeKey: "12345",
        dataset: "testing",
        transmission: "mock",
        disabled: true,
      });
      let transmission = honey.transmission;

      expect(transmission).toBe(null);
      await expect(honey.flush()).resolves.toBeUndefined();
    });
  });
});

describe("isClassic check", () => {
  it.each([
    {
      testString: "hcxik_01hqk4k20cjeh63wca8vva5stw70nft6m5n8wr8f5mjx3762s8269j50wc",
      name: "full ingest key string, non classic",
      expected: false
    },
    {
      testString: "hcxik_01hqk4k20cjeh63wca8vva5stw",
      name: "ingest key id, non classic",
      expected: false
    },
    {
      testString: "hcaic_1234567890123456789012345678901234567890123456789012345678",
      name: "full ingest key string, classic",
      expected: true
    },
    {
      testString: "hcaic_12345678901234567890123456",
      name: "ingest key id, classic",
      expected: false
    },
    {
      testString: "kgvSpPwegJshQkuowXReLD",
      name: "v2 configuration key",
      expected: false
    },
    {
      testString: "12345678901234567890123456789012",
      name: "classic key",
      expected: true
    },
    {
      testString: "",
      name: "no key",
      expected: true
    }

  ])("test case $name", (testCase) => {
    expect(libhoney.isClassic(testCase.testString)).toEqual(testCase.expected);
  });
});
