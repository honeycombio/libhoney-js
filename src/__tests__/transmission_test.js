/* eslint-env node, jest */
import assert from "assert";
import { Transmission, ValidatedEvent } from "../transmission";

let superagent = require("superagent");
let mock = require("superagent-mocker")(superagent);

describe("base transmission", function() {
  it("should handle batchSizeTrigger of 0", function(done) {
    mock.post("http://localhost:9999/1/events/test-transmission", function(
      req
    ) {
      let reqEvents = JSON.parse(req.body);
      let resp = reqEvents.map(() => ({ status: 202 }));
      return { text: JSON.stringify(resp) };
    });

    var transmission = new Transmission({
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

  it("should send a batch when batchSizeTrigger is met, not exceeded", function(done) {
    var responseCount = 0;
    var responseExpected = 5;

    mock.post("http://localhost:9999/1/batch/test-transmission", function(req) {
      let reqEvents = JSON.parse(req.body);
      let resp = reqEvents.map(() => ({ status: 202 }));
      return { text: JSON.stringify(resp) };
    });

    var transmission = new Transmission({
      batchTimeTrigger: 10000, // larger than the mocha timeout
      batchSizeTrigger: 5,
      responseCallback(queue) {
        responseCount += queue.length;
        queue.splice(0, queue.length);
        if (responseCount == responseExpected) {
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

  it("should handle apiHosts with trailing slashes", function(done) {
    let endpointHit = false;
    mock.post("http://localhost:9999/1/batch/test-transmission", function(req) {
      endpointHit = true;
      let reqEvents = JSON.parse(req.body);
      let resp = reqEvents.map(() => ({ status: 202 }));
      return { text: JSON.stringify(resp) };
    });

    var transmission = new Transmission({
      batchTimeTrigger: 0,
      responseCallback: function(_resp) {
        assert.equal(true, endpointHit);
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

  it("should eventually send a single event (after the timeout)", function(done) {
    var transmission = new Transmission({
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

  it("should respect sample rate and accept the event", function(done) {
    var transmission = new Transmission({
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

  it("should respect sample rate and drop the event", function(done) {
    var transmission = new Transmission({ batchTimeTrigger: 10 });

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

  it("should drop events beyond the pendingWorkCapacity", function(done) {
    var eventDropped;
    var droppedExpected = 5;
    var responseCount = 0;
    var responseExpected = 5;

    mock.post("http://localhost:9999/1/batch/test-transmission", function(req) {
      let reqEvents = JSON.parse(req.body);
      let resp = reqEvents.map(() => ({ status: 202 }));
      return { text: JSON.stringify(resp) };
    });

    var transmission = new Transmission({
      batchTimeTrigger: 50,
      pendingWorkCapacity: responseExpected,
      responseCallback(queue) {
        responseCount += queue.length;
        queue.splice(0, queue.length);
        if (responseCount == responseExpected) {
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
    // verify that
    // droppedCount behaves the way we want
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
      assert.equal(true, eventDropped);
    }
  });

  it("should send the right number events even if it requires multiple concurrent batches", function(done) {
    var responseCount = 0;
    var responseExpected = 10;

    mock.post("http://localhost:9999/1/batch/test-transmission", function(req) {
      let reqEvents = JSON.parse(req.body);
      let resp = reqEvents.map(() => ({ status: 202 }));
      return { text: JSON.stringify(resp) };
    });

    var transmission = new Transmission({
      batchTimeTrigger: 50,
      batchSizeTrigger: 5,
      pendingWorkCapacity: responseExpected,
      responseCallback(queue) {
        responseCount += queue.length;
        queue.splice(0, queue.length);
        if (responseCount == responseExpected) {
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

  it("should send the right number of events even if they all fail", function(done) {
    var responseCount = 0;
    var responseExpected = 10;

    mock.post("http://localhost:9999/1/batch/test-transmission", function(
      _req
    ) {
      return { status: 404 };
    });

    var transmission = new Transmission({
      batchTimeTrigger: 50,
      batchSizeTrigger: 5,
      maxConcurrentBatches: 1,
      pendingWorkCapacity: responseExpected,
      responseCallback(queue) {
        let responses = queue.splice(0, queue.length);
        responses.forEach(({ error, status_code }) => {
          assert.equal(404, error.status);
          assert.equal(404, status_code);
          responseCount++;
          if (responseCount == responseExpected) {
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

  it("should send the right number of events even it requires more batches than maxConcurrentBatch", function(done) {
    var responseCount = 0;
    var responseExpected = 50;
    var batchSize = 2;
    mock.post("http://localhost:9999/1/batch/test-transmission", function(req) {
      let reqEvents = JSON.parse(req.body);
      let resp = reqEvents.map(() => ({ status: 202 }));
      return { text: JSON.stringify(resp) };
    });

    var transmission = new Transmission({
      batchTimeTrigger: 50,
      batchSizeTrigger: batchSize,
      pendingWorkCapacity: responseExpected,
      responseCallback(queue) {
        responseCount += queue.length;
        queue.splice(0, queue.length);
        if (responseCount == responseExpected) {
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

  it("should send 100% of presampled events", function(done) {
    var responseCount = 0;
    var responseExpected = 10;
    mock.post("http://localhost:9999/1/batch/test-transmission", function(req) {
      let reqEvents = JSON.parse(req.body);
      let resp = reqEvents.map(() => ({ status: 202 }));
      return { text: JSON.stringify(resp) };
    });

    var transmission = new Transmission({
      responseCallback(queue) {
        let responses = queue.splice(0, queue.length);
        responses.forEach(resp => {
          if (resp.error) {
            console.log(resp.error);
            return;
          }
          responseCount++;
          if (responseCount == responseExpected) {
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

  it("should deal with encoding errors", function(done) {
    var responseCount = 0;
    var responseExpected = 11;
    mock.post("http://localhost:9999/1/batch/test-transmission", function(req) {
      let reqEvents = JSON.parse(req.body);
      let resp = reqEvents.map(() => ({ status: 202 }));
      return { text: JSON.stringify(resp) };
    });

    var transmission = new Transmission({
      responseCallback(queue) {
        let responses = queue.splice(0, queue.length);
        responses.forEach(_resp => {
          responseCount++;
          if (responseCount == responseExpected) {
            done();
          }
        });
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
      let a = {};
      a.a = a;
      transmission.sendPresampledEvent(
        new ValidatedEvent({
          apiHost: "http://localhost:9999",
          writeKey: "123456789",
          dataset: "test-transmission",
          sampleRate: 10,
          timestamp: a,
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

  it("should allow user-agent additions", function(done) {
    var responseCount = 0;
    var responseExpected = 2;

    var UAs = [
      {
        dataset: "test-transmission1",
        addition: "",
        probe: ua =>
          ua.indexOf("libhoney") === 0 && ua.indexOf("addition") === -1
      },
      {
        dataset: "test-transmission2",
        addition: "user-agent addition",
        probe: ua =>
          ua.indexOf("libhoney") === 0 && ua.indexOf("addition") !== -1
      }
    ];

    // set up our endpoints
    UAs.forEach(ua =>
      mock.post(`http://localhost:9999/1/batch/${ua.dataset}`, function(req) {
        if (!ua.probe(req.headers["user-agent"])) {
          done(new Error("unexpected user-agent addition"));
        }
        return {};
      })
    );

    // now send our events through separate transmissions with different UA
    // additions
    UAs.forEach(ua => {
      var transmission = new Transmission({
        batchSizeTrigger: 1, // so we'll send individual events
        responseCallback(queue) {
          let responses = queue.splice(0, queue.length);
          responseCount += responses.length;
          if (responseCount === responseExpected) {
            done();
          }
        },
        userAgentAddition: ua.addition
      });

      transmission.sendPresampledEvent(
        new ValidatedEvent({
          apiHost: "http://localhost:9999",
          writeKey: "123456789",
          dataset: ua.dataset,
          sampleRate: 1,
          timestamp: new Date(),
          postData: JSON.stringify({ a: 1, b: 2 })
        })
      );
    });
  });
});
