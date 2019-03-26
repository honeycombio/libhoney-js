// Copyright 2016 Hound Technology, Inc. All rights reserved.
// Use of this source code is governed by the Apache License 2.0
// license that can be found in the LICENSE file.

/* global window, global */

/**
 * @module
 */
import proxy from "superagent-proxy";
import superagent from "superagent";
import urljoin from "urljoin";

const USER_AGENT = "libhoney-js/<@LIBHONEY_JS_VERSION@>";

const _global =
  typeof window !== "undefined"
    ? window
    : typeof global !== "undefined"
      ? global
      : undefined;

// how many events to collect in a batch
const batchSizeTrigger = 50; // either when the eventQueue is > this length
const batchTimeTrigger = 100; // or it's been more than this many ms since the first push

// how many batches to maintain in parallel
const maxConcurrentBatches = 10;

// how many events to queue up for busy batches before we start dropping
const pendingWorkCapacity = 10000;

const emptyResponseCallback = function() {};

const eachPromise = (arr, iteratorFn) =>
  arr.reduce((p, item) => {
    return p.then(() => {
      return iteratorFn(item);
    });
  }, Promise.resolve());

const partition = (arr, keyfn, createfn, addfn) => {
  let result = Object.create(null);
  arr.forEach(v => {
    let key = keyfn(v);
    if (!result[key]) {
      result[key] = createfn(v);
    } else {
      addfn(result[key], v);
    }
  });
  return result;
};

class BatchEndpointAggregator {
  constructor(events) {
    this.batches = partition(
      events,
      /* keyfn */
      ev => `${ev.apiHost}_${ev.writeKey}_${ev.dataset}`,
      /* createfn */
      ev => ({
        apiHost: ev.apiHost,
        writeKey: ev.writeKey,
        dataset: ev.dataset,
        events: [ev]
      }),
      /* addfn */
      (batch, ev) => batch.events.push(ev)
    );
  }

  encodeBatchEvents(events) {
    let first = true;
    let numEncoded = 0;
    let encodedEvents = events.reduce((acc, ev) => {
      try {
        let encodedEvent = ev.toJSON(); // directly call toJSON, not JSON.stringify, because the latter wraps it in an additional set of quotes
        numEncoded++;
        let newAcc = acc + (!first ? "," : "") + encodedEvent;
        first = false;
        return newAcc;
      } catch (e) {
        ev.encodeError = e;
        return acc;
      }
    }, "");

    let encoded = "[" + encodedEvents + "]";
    return { encoded, numEncoded };
  }
}

/**
 * @private
 */
export class ValidatedEvent {
  constructor({
    timestamp,
    apiHost,
    postData,
    writeKey,
    dataset,
    sampleRate,
    metadata
  }) {
    this.timestamp = timestamp;
    this.apiHost = apiHost;
    this.postData = postData;
    this.writeKey = writeKey;
    this.dataset = dataset;
    this.sampleRate = sampleRate;
    this.metadata = metadata;
  }

  toJSON() {
    let fields = [];
    if (this.timestamp) {
      fields.push(`"time":${JSON.stringify(this.timestamp)}`);
    }
    if (this.sampleRate) {
      fields.push(`"samplerate":${JSON.stringify(this.sampleRate)}`);
    }
    if (this.postData) {
      fields.push(`"data":${this.postData}`);
    }
    return `{${fields.join(",")}}`;
  }
}

export class MockTransmission {
  constructor(options) {
    this.constructorArg = options;
    this.events = [];
  }

  sendEvent(ev) {
    this.events.push(ev);
  }

  sendPresampledEvent(ev) {
    this.events.push(ev);
  }

  reset() {
    this.constructorArg = null;
    this.events = [];
  }
}

export class WriterTransmission {
  sendEvent(ev) {
    console.log(JSON.stringify(ev));
  }

  sendPresampledEvent(ev) {
    console.log(JSON.stringify(ev));
  }
}

export class NullTransmission {
  sendEvent(_ev) {}

  sendPresampledEvent(_ev) {}
}

/**
 * @private
 */
export class Transmission {
  constructor(options) {
    this._responseCallback = emptyResponseCallback;
    this._batchSizeTrigger = batchSizeTrigger;
    this._batchTimeTrigger = batchTimeTrigger;
    this._maxConcurrentBatches = maxConcurrentBatches;
    this._pendingWorkCapacity = pendingWorkCapacity;
    this._sendTimeoutId = -1;
    this._eventQueue = [];
    this._batchCount = 0;

    if (typeof options.responseCallback === "function") {
      this._responseCallback = options.responseCallback;
    }
    if (typeof options.batchSizeTrigger === "number") {
      this._batchSizeTrigger = Math.max(options.batchSizeTrigger, 1);
    }
    if (typeof options.batchTimeTrigger === "number") {
      this._batchTimeTrigger = options.batchTimeTrigger;
    }
    if (typeof options.maxConcurrentBatches === "number") {
      this._maxConcurrentBatches = options.maxConcurrentBatches;
    }
    if (typeof options.pendingWorkCapacity === "number") {
      this._pendingWorkCapacity = options.pendingWorkCapacity;
    }

    this._userAgentAddition = options.userAgentAddition || "";
    this._proxy = options.proxy;

    // Included for testing; to stub out randomness and verify that an event
    // was dropped.
    this._randomFn = Math.random;
  }

  _droppedCallback(ev, reason) {
    this._responseCallback([
      {
        metadata: ev.metadata,
        error: new Error(reason)
      }
    ]);
  }

  sendEvent(ev) {
    // bail early if we aren't sampling this event
    if (!this._shouldSendEvent(ev)) {
      this._droppedCallback(ev, "event dropped due to sampling");
      return;
    }

    this.sendPresampledEvent(ev);
  }

  sendPresampledEvent(ev) {
    if (this._eventQueue.length >= this._pendingWorkCapacity) {
      this._droppedCallback(ev, "queue overflow");
      return;
    }
    this._eventQueue.push(ev);
    if (this._eventQueue.length >= this._batchSizeTrigger) {
      this._sendBatch();
    } else {
      this._ensureSendTimeout();
    }
  }

  _sendBatch() {
    if (this._batchCount === maxConcurrentBatches) {
      // don't start up another concurrent batch.  the next timeout/sendEvent or batch completion
      // will cause us to send another
      return;
    }

    this._clearSendTimeout();

    this._batchCount++;

    let batch = this._eventQueue.splice(0, this._batchSizeTrigger);

    let batchAgg = new BatchEndpointAggregator(batch);

    const finishBatch = () => {
      this._batchCount--;

      let queueLength = this._eventQueue.length;
      if (queueLength > 0) {
        if (queueLength >= this._batchSizeTrigger) {
          this._sendBatch();
        } else {
          this._ensureSendTimeout();
        }
      }
    };

    let batches = Object.keys(batchAgg.batches).map(k => batchAgg.batches[k]);
    eachPromise(batches, batch => {
      let url = urljoin(batch.apiHost, "/1/batch", batch.dataset);
      let req = superagent.post(url);
      if (this._proxy) {
        req = proxy(req, this._proxy);
      }

      let { encoded, numEncoded } = batchAgg.encodeBatchEvents(batch.events);
      return new Promise(resolve => {
        // if we failed to encode any of the events, no point in sending anything to honeycomb
        if (numEncoded === 0) {
          this._responseCallback(
            batch.events.map(ev => ({
              metadata: ev.metadata,
              error: ev.encodeError
            }))
          );
          resolve();
          return;
        }

        let userAgent = USER_AGENT;
        let trimmedAddition = this._userAgentAddition.trim();
        if (trimmedAddition) {
          userAgent = `${USER_AGENT} ${trimmedAddition}`;
        }

        let start = Date.now();
        req
          .set("X-Hny-Team", batch.writeKey)
          .set("User-Agent", userAgent)
          .type("json")
          .send(encoded)
          .end((err, res) => {
            let end = Date.now();

            if (err) {
              this._responseCallback(
                batch.events.map(ev => ({
                  // eslint-disable-next-line camelcase
                  status_code: ev.encodeError ? undefined : err.status,
                  duration: end - start,
                  metadata: ev.metadata,
                  error: ev.encodeError || err
                }))
              );
            } else {
              let response = JSON.parse(res.text);
              let respIdx = 0;
              this._responseCallback(
                batch.events.map(ev => {
                  if (ev.encodeError) {
                    return {
                      duration: end - start,
                      metadata: ev.metadata,
                      error: ev.encodeError
                    };
                  } else {
                    let res = response[respIdx++];
                    return {
                      // eslint-disable-next-line camelcase
                      status_code: res.status,
                      duration: end - start,
                      metadata: ev.metadata,
                      error: res.err
                    };
                  }
                })
              );
            }
            // we resolve unconditionally to continue the iteration in eachSeries.  errors will cause
            // the event to be re-enqueued/dropped.
            resolve();
          });
      });
    })
      .then(finishBatch)
      .catch(finishBatch);
  }

  _shouldSendEvent(ev) {
    let { sampleRate } = ev;
    if (sampleRate <= 1) {
      return true;
    }
    return this._randomFn() < 1 / sampleRate;
  }

  _ensureSendTimeout() {
    if (this._sendTimeoutId === -1) {
      this._sendTimeoutId = _global.setTimeout(
        () => this._sendBatch(),
        this._batchTimeTrigger
      );
    }
  }

  _clearSendTimeout() {
    if (this._sendTimeoutId !== -1) {
      _global.clearTimeout(this._sendTimeoutId);
      this._sendTimeoutId = -1;
    }
  }
}
