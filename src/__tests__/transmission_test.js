/* eslint-env node, jest */
import { Transmission, ValidatedEvent } from "../transmission";
import net from "net";

let superagent = require("superagent");
let mock = require("superagent-mocker")(superagent);

describe("base transmission", () => {
  it("will hit a proxy", done => {
    let server = net.createServer(socket => {
      socket.end();
      server.unref();
      done();
    });

    server.listen(9998, "127.0.0.1");

    let transmission = new Transmission({
      proxy: "http://127.0.0.1:9998",
      batchTimeTrigger: 10000, // larger than the mocha timeout
      batchSizeTrigger: 0
    });

    transmission.sendEvent(
      new ValidatedEvent({
        apiHost: "http://localhost:9999",
        writeKey: "123456789",
        dataset: "test-transmission",
        sampleRate: 1,
        timestamp: new Date(),
        postData: JSON.stringify({ a: 1, b: 2 })
      })
    );
  });

  it("should handle batchSizeTrigger of 0", done => {
    mock.post("http://localhost:9999/1/events/test-transmission", req => {
      let reqEvents = JSON.parse(req.body);
      let resp = reqEvents.map(() => ({ status: 202 }));
      return { text: JSON.stringify(resp) };
    });

    let transmission = new Transmission({
      batchTimeTrigger: 10000, // larger than the mocha timeout
      batchSizeTrigger: 0,
      responseCallback() {
        done();
      }
    });

    transmission.sendEvent(
      new ValidatedEvent({
        apiHost: "http://localhost:9999",
        writeKey: "123456789",
        dataset: "test-transmission",
        sampleRate: 1,
        timestamp: new Date(),
        postData: JSON.stringify({ a: 1, b: 2 })
      })
    );
  });

  it("should send a batch when batchSizeTrigger is met, not exceeded", done => {
    let responseCount = 0;
    let batchSize = 5;

    mock.post("http://localhost:9999/1/batch/test-transmission", req => {
      let reqEvents = JSON.parse(req.body);
      let resp = reqEvents.map(() => ({ status: 202 }));
      return { text: JSON.stringify(resp) };
    });

    let transmission = new Transmission({
      batchTimeTrigger: 10000, // larger than the mocha timeout
      batchSizeTrigger: 5,
      responseCallback(queue) {
        responseCount += queue.length;
        queue.splice(0, queue.length);
        return responseCount === batchSize
          ? done()
          : done(
              "The events dispatched over transmission does not align with batch size when the same number of " +
                `events were enqueued as the batchSizeTrigger. Expected ${batchSize}, got ${responseCount}.`
            );
      }
    });

    for (let i = 0; i < batchSize; i++) {
      transmission.sendEvent(
        new ValidatedEvent({
          apiHost: "http://localhost:9999",
          writeKey: "123456789",
          dataset: "test-transmission",
          sampleRate: 1,
          timestamp: new Date(),
          postData: JSON.stringify({ a: 1, b: 2 })
        })
      );
    }
  });

  it("should handle apiHosts with trailing slashes", done => {
    let endpointHit = false;
    mock.post("http://localhost:9999/1/batch/test-transmission", req => {
      endpointHit = true;
      let reqEvents = JSON.parse(req.body);
      let resp = reqEvents.map(() => ({ status: 202 }));
      return { text: JSON.stringify(resp) };
    });

    let transmission = new Transmission({
      batchTimeTrigger: 0,
      responseCallback: function(_resp) {
        expect(endpointHit).toBe(true);
        done();
      }
    });

    transmission.sendEvent(
      new ValidatedEvent({
        apiHost: "http://localhost:9999/",
        writeKey: "123456789",
        dataset: "test-transmission",
        sampleRate: 1,
        timestamp: new Date(),
        postData: JSON.stringify({ a: 1, b: 2 })
      })
    );
  });

  it("should eventually send a single event (after the timeout)", done => {
    let transmission = new Transmission({
      batchTimeTrigger: 10,
      responseCallback: function(_resp) {
        done();
      }
    });

    transmission.sendEvent(
      new ValidatedEvent({
        apiHost: "http://localhost:9999",
        writeKey: "123456789",
        dataset: "test-transmission",
        sampleRate: 1,
        timestamp: new Date(),
        postData: JSON.stringify({ a: 1, b: 2 })
      })
    );
  });

  it("should respect sample rate and accept the event", done => {
    let transmission = new Transmission({
      batchTimeTrigger: 10,
      responseCallback: function(_resp) {
        done();
      }
    });

    transmission._randomFn = function() {
      return 0.09;
    };
    transmission.sendEvent(
      new ValidatedEvent({
        apiHost: "http://localhost:9999",
        writeKey: "123456789",
        dataset: "test-transmission",
        sampleRate: 10,
        timestamp: new Date(),
        postData: JSON.stringify({ a: 1, b: 2 })
      })
    );
  });

  it("should respect sample rate and drop the event", done => {
    let transmission = new Transmission({ batchTimeTrigger: 10 });

    transmission._randomFn = function() {
      return 0.11;
    };
    transmission._droppedCallback = function() {
      done();
    };

    transmission.sendEvent(
      new ValidatedEvent({
        apiHost: "http://localhost:9999",
        writeKey: "123456789",
        dataset: "test-transmission",
        sampleRate: 10,
        timestamp: new Date(),
        postData: JSON.stringify({ a: 1, b: 2 })
      })
    );
  });

  it("should drop events beyond the pendingWorkCapacity", done => {
    let eventDropped;
    let droppedExpected = 5;
    let responseCount = 0;
    let responseExpected = 5;

    mock.post("http://localhost:9999/1/batch/test-transmission", req => {
      let reqEvents = JSON.parse(req.body);
      let resp = reqEvents.map(() => ({ status: 202 }));
      return { text: JSON.stringify(resp) };
    });

    let transmission = new Transmission({
      batchTimeTrigger: 50,
      pendingWorkCapacity: responseExpected,
      responseCallback(queue) {
        responseCount += queue.length;
        queue.splice(0, queue.length);
        if (responseCount === responseExpected) {
          done();
        }
      }
    });

    transmission._droppedCallback = function() {
      eventDropped = true;
    };

    // send the events we expect responses for
    for (let i = 0; i < responseExpected; i++) {
      transmission.sendEvent(
        new ValidatedEvent({
          apiHost: "http://localhost:9999",
          writeKey: "123456789",
          dataset: "test-transmission",
          sampleRate: 1,
          timestamp: new Date(),
          postData: JSON.stringify({ a: 1, b: 2 })
        })
      );
    }

    // send the events we expect to drop.  Since JS is single threaded we can
    // verify that droppedCount behaves the way we want.
    for (let i = 0; i < droppedExpected; i++) {
      eventDropped = false;
      transmission.sendEvent(
        new ValidatedEvent({
          apiHost: "http://localhost:9999",
          writeKey: "123456789",
          dataset: "test-transmission",
          sampleRate: 1,
          timestamp: new Date(),
          postData: JSON.stringify({ a: 1, b: 2 })
        })
      );
      expect(eventDropped).toBe(true);
    }
  });

  it("should send the right number events even if it requires multiple concurrent batches", done => {
    let responseCount = 0;
    let responseExpected = 10;

    mock.post("http://localhost:9999/1/batch/test-transmission", req => {
      let reqEvents = JSON.parse(req.body);
      let resp = reqEvents.map(() => ({ status: 202 }));
      return { text: JSON.stringify(resp) };
    });

    let transmission = new Transmission({
      batchTimeTrigger: 50,
      batchSizeTrigger: 5,
      pendingWorkCapacity: responseExpected,
      responseCallback(queue) {
        responseCount += queue.length;
        queue.splice(0, queue.length);
        if (responseCount === responseExpected) {
          done();
        }
      }
    });

    for (let i = 0; i < responseExpected; i++) {
      transmission.sendEvent(
        new ValidatedEvent({
          apiHost: "http://localhost:9999",
          writeKey: "123456789",
          dataset: "test-transmission",
          sampleRate: 1,
          timestamp: new Date(),
          postData: JSON.stringify({ a: 1, b: 2 })
        })
      );
    }
  });

  it("should send the right number of events even if they all fail", done => {
    let responseCount = 0;
    let responseExpected = 10;

    mock.post("http://localhost:9999/1/batch/test-transmission", _req => {
      return { status: 404 };
    });

    let transmission = new Transmission({
      batchTimeTrigger: 50,
      batchSizeTrigger: 5,
      maxConcurrentBatches: 1,
      pendingWorkCapacity: responseExpected,
      responseCallback(queue) {
        let responses = queue.splice(0, queue.length);
        responses.forEach(({ error, status_code: statusCode }) => {
          expect(error.status).toEqual(404);
          expect(statusCode).toEqual(404);
          responseCount++;
          if (responseCount === responseExpected) {
            done();
          }
        });
      }
    });

    for (let i = 0; i < responseExpected; i++) {
      transmission.sendEvent(
        new ValidatedEvent({
          apiHost: "http://localhost:9999",
          writeKey: "123456789",
          dataset: "test-transmission",
          sampleRate: 1,
          timestamp: new Date(),
          postData: JSON.stringify({ a: 1, b: 2 })
        })
      );
    }
  });

  it("should send the right number of events even it requires more batches than maxConcurrentBatch", done => {
    let responseCount = 0;
    let responseExpected = 50;
    let batchSize = 2;
    mock.post("http://localhost:9999/1/batch/test-transmission", req => {
      let reqEvents = JSON.parse(req.body);
      let resp = reqEvents.map(() => ({ status: 202 }));
      return { text: JSON.stringify(resp) };
    });

    let transmission = new Transmission({
      batchTimeTrigger: 50,
      batchSizeTrigger: batchSize,
      pendingWorkCapacity: responseExpected,
      responseCallback(queue) {
        responseCount += queue.length;
        queue.splice(0, queue.length);
        if (responseCount === responseExpected) {
          done();
        }
      }
    });

    for (let i = 0; i < responseExpected; i++) {
      transmission.sendEvent(
        new ValidatedEvent({
          apiHost: "http://localhost:9999",
          writeKey: "123456789",
          dataset: "test-transmission",
          sampleRate: 1,
          timestamp: new Date(),
          postData: JSON.stringify({ a: 1, b: 2 })
        })
      );
    }
  });

  it("should send 100% of presampled events", done => {
    let responseCount = 0;
    let responseExpected = 10;
    mock.post("http://localhost:9999/1/batch/test-transmission", req => {
      let reqEvents = JSON.parse(req.body);
      let resp = reqEvents.map(() => ({ status: 202 }));
      return { text: JSON.stringify(resp) };
    });

    let transmission = new Transmission({
      responseCallback(queue) {
        let responses = queue.splice(0, queue.length);
        responses.forEach(resp => {
          if (resp.error) {
            console.log(resp.error);
            return;
          }
          responseCount++;
          if (responseCount === responseExpected) {
            done();
          }
        });
      }
    });

    for (let i = 0; i < responseExpected; i++) {
      transmission.sendPresampledEvent(
        new ValidatedEvent({
          apiHost: "http://localhost:9999",
          writeKey: "123456789",
          dataset: "test-transmission",
          sampleRate: 10,
          timestamp: new Date(),
          postData: JSON.stringify({ a: 1, b: 2 })
        })
      );
    }
  });

  it("should deal with encoding errors", done => {
    let responseCount = 0;
    let responseExpected = 11;
    mock.post("http://localhost:9999/1/batch/test-transmission", req => {
      let reqEvents = JSON.parse(req.body);
      let resp = reqEvents.map(() => ({ status: 202 }));
      return { text: JSON.stringify(resp) };
    });

    let transmission = new Transmission({
      responseCallback(queue) {
        responseCount = queue.length;
        return responseCount === responseExpected
          ? done()
          : done(
              Error(
                "Incorrect queue length. Queue should equal length of all valid and invalid events enqueued."
              )
            );
      }
    });

    let a = {};
    a.a = a;
    for (let i = 0; i < 5; i++) {
      transmission.sendPresampledEvent(
        new ValidatedEvent({
          apiHost: "http://localhost:9999",
          writeKey: "123456789",
          dataset: "test-transmission",
          sampleRate: 10,
          timestamp: new Date(),
          postData: JSON.stringify({ a: 1, b: 2 })
        })
      );
    }
    {
      // send an event that fails to encode
      let b = {};
      b.b = b;
      transmission.sendPresampledEvent(
        new ValidatedEvent({
          apiHost: "http://localhost:9999",
          writeKey: "123456789",
          dataset: "test-transmission",
          sampleRate: 10,
          timestamp: b,
          postData: JSON.stringify({ a: 1, b: 2 })
        })
      );
    }
    for (let i = 0; i < 5; i++) {
      transmission.sendPresampledEvent(
        new ValidatedEvent({
          apiHost: "http://localhost:9999",
          writeKey: "123456789",
          dataset: "test-transmission",
          sampleRate: 10,
          timestamp: new Date(),
          postData: JSON.stringify({ a: 1, b: 2 })
        })
      );
    }
  });

  it("should allow user-agent additions", done => {
    let responseCount = 0;
    let responseExpected = 2;

    let userAgents = [
      {
        dataset: "test-transmission1",
        addition: "",
        probe: userAgent =>
          userAgent.indexOf("libhoney") === 0 &&
          userAgent.indexOf("addition") === -1
      },
      {
        dataset: "test-transmission2",
        addition: "user-agent addition",
        probe: userAgent =>
          userAgent.indexOf("libhoney") === 0 &&
          userAgent.indexOf("addition") !== -1
      }
    ];

    // set up our endpoints
    userAgents.forEach(userAgent =>
      mock.post(`http://localhost:9999/1/batch/${userAgent.dataset}`, req => {
        if (!userAgent.probe(req.headers["user-agent"])) {
          done(new Error("unexpected user-agent addition"));
        }
        return {};
      })
    );

    // now send our events through separate transmissions with different user
    // agent additions.
    userAgents.forEach(userAgent => {
      let transmission = new Transmission({
        batchSizeTrigger: 1, // so we'll send individual events
        responseCallback(queue) {
          let responses = queue.splice(0, queue.length);
          responseCount += responses.length;
          if (responseCount === responseExpected) {
            done();
          }
        },
        userAgentAddition: userAgent.addition
      });

      transmission.sendPresampledEvent(
        new ValidatedEvent({
          apiHost: "http://localhost:9999",
          writeKey: "123456789",
          dataset: userAgent.dataset,
          sampleRate: 1,
          timestamp: new Date(),
          postData: JSON.stringify({ a: 1, b: 2 })
        })
      );
    });
  });
});
