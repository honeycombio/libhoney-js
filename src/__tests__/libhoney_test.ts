/* eslint-env node, jest */
import libhoney from "../libhoney";
import superagent from "superagent";
import superagentMocker from "superagent-mocker";

let mock = superagentMocker(superagent);

describe("libhoney", () => {
  describe("event properties", () => {
    it("should ultimately fallback to hardcoded defaults", () => {
      let honey = new libhoney({
        // these two properties are required
        writeKey: "12345",
        dataset: "testing",
        transmission: "mock"
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
      expect(transmission.events[0].postData).toEqual(JSON.stringify(postData));
    });

    it("should come from libhoney options if not specified in event", () => {
      let honey = new libhoney({
        apiHost: "http://foo/bar",
        writeKey: "12345",
        dataset: "testing",
        transmission: "mock"
      });
      let transmission = honey.transmission;
      let postData = { a: 1, b: 2 };
      honey.sendNow(postData);

      expect(transmission.events).toHaveLength(1);
      expect(transmission.events[0].apiHost).toEqual("http://foo/bar");
      expect(transmission.events[0].writeKey).toEqual("12345");
      expect(transmission.events[0].dataset).toEqual("testing");
      expect(transmission.events[0].postData).toEqual(JSON.stringify(postData));
    });
  });

  describe("response queue", () => {
    it("should enqueue a maximum of maxResponseQueueSize, dropping new responses (not old)", done => {
      mock.post("http://localhost:9999/1/events/testResponseQueue", (_req: any) => {
        return {};
      });

      let queueSize = 50;
      let queueFullCount = 0;
      let honey = new libhoney({
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
          queue.sort((a: { metadata: any }, b: { metadata: any}) => a.metadata - b.metadata);
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
    it("should not hit transmission", () => {
      let honey = new libhoney({
        // these two properties are required
        writeKey: "12345",
        dataset: "testing",
        transmission: "mock",
        disabled: true
      });
      let transmission = honey.transmission;

      expect(transmission).toBe(null);
    });
  });
});
