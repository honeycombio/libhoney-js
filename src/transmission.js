// Copyright 2016 Hound Technology, Inc. All rights reserved.
// Use of this source code is governed by the Apache License 2.0
// license that can be found in the LICENSE file.

// jshint esversion: 6
/* global require, window, global */

/**
 * @module
 */
import superagent from 'superagent';
import urljoin from 'urljoin';

const userAgent = "libhoney-js/LIBHONEY_JS_VERSION";

const _global = (typeof window !== "undefined" ? window :
                 typeof global !== "undefined" ? global : undefined);

// how many events to collect in a batch
const batchSizeTrigger = 50;  // either when the eventQueue is > this length
const batchTimeTrigger = 100; // or it's been more than this many ms since the first push

// how many batches to maintain in parallel
const maxConcurrentBatches = 10;

// how many events to queue up for busy batches before we start dropping
const pendingWorkCapacity = 10000;

const emptyResponseCallback = function() { };

const eachPromise = (arr, iteratorFn) =>
    arr.reduce(function(p, item) {
        return p.then(function() {
            return iteratorFn(item);
        });
    }, Promise.resolve());

const partition = (arr, keyfn, createfn, addfn) => {
  let result = Object.create(null);
  arr.forEach((v) => {
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
    this.batches = partition(events,
                             /* keyfn */
                             (ev) => `${ev.apiHost}_${ev.writeKey}_${ev.dataset}`,
                             /* createfn */
                             (ev) => ({
                               apiHost: ev.apiHost,
                               writeKey: ev.writeKey,
                               dataset: ev.dataset,
                               events: [ev]
                             }),
                             /* addfn */
                             (batch, ev) => batch.events.push(ev));
  }

  encodeBatchEvents (events) {
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
export default class Transmission {

  constructor (options) {
    this._responseCallback = emptyResponseCallback;
    this._batchSizeTrigger = batchSizeTrigger;
    this._batchTimeTrigger = batchTimeTrigger;
    this._maxConcurrentBatches = maxConcurrentBatches;
    this._pendingWorkCapacity = pendingWorkCapacity;
    this._sendTimeoutId = -1;
    this._eventQueue = [];
    this._batchCount = 0;
    
    if (typeof options.responseCallback == "function") {
      this._responseCallback = options.responseCallback;
    }
    if (typeof options.batchSizeTrigger == "number") {
      this._batchSizeTrigger = Math.max(options.batchSizeTrigger, 1);
    }
    if (typeof options.batchTimeTrigger == "number") {
      this._batchTimeTrigger = options.batchTimeTrigger;
    }
    if (typeof options.maxConcurrentBatches == "number") {
      this._maxConcurrentBatches = options.maxConcurrentBatches;
    }
    if (typeof options.pendingWorkCapacity == "number") {
      this._pendingWorkCapacity = options.pendingWorkCapacity;
    }

    // Included for testing; to stub out randomness and verify that an event
    // was dropped.
    this._randomFn = Math.random;
  }

  _droppedCallback(ev, reason) {
    this._responseCallback([{
      metadata: ev.metadata,
      error: new Error(reason)
    }]);
  }
  
  sendEvent (ev) {
    // bail early if we aren't sampling this event
    if (!this._shouldSendEvent(ev)) {
      this._droppedCallback(ev, "event dropped due to sampling");
      return;
    }

    this.sendPresampledEvent(ev);
  }

  sendPresampledEvent (ev) {
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

  _sendBatch () {
    if (this._batchCount == maxConcurrentBatches) {
      // don't start up another concurrent batch.  the next timeout/sendEvent or batch completion
      // will cause us to send another
      return;
    }

    this._clearSendTimeout();

    this._batchCount++;

    var batch = this._eventQueue.splice(0, this._batchSizeTrigger);

    let batchAgg = new BatchEndpointAggregator(batch);

    let finishBatch = () => {
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

    let batches = Object.keys(batchAgg.batches).map((k) => batchAgg.batches[k]);
    eachPromise(batches, (batch) => {
      var url = urljoin(batch.apiHost, "/1/batch", batch.dataset);
      var req = superagent.post(url);

      let { encoded, numEncoded } = batchAgg.encodeBatchEvents(batch.events);
      return new Promise( (resolve) => {

        // if we failed to encode any of the events, no point in sending anything to honeycomb
        if (numEncoded === 0) {
          this._responseCallback(batch.events.map((ev) => ({
            metadata: ev.metadata,
            error: ev.encodeError
          })));
          resolve();
          return;
        }

        var start = Date.now();
        req
          .set('X-Hny-Team', batch.writeKey)
          .set('User-Agent', userAgent)
          .type("json")
          .send(encoded)
          .end((err, res) => {
            let end = Date.now();

            if (err) {
              this._responseCallback(batch.events.map((ev) => ({
                status_code: ev.encodeError ? undefined : err.status,
                duration: end - start,
                metadata: ev.metadata,
                error: ev.encodeError || err
              })));
            } else {
              let response = JSON.parse(res.text);
              let respIdx = 0;
              this._responseCallback(batch.events.map((ev) => {
                if (ev.encodeError) {
                  return {
                    duration: end - start,
                    metadata: ev.metadata,
                    error: ev.encodeError
                  };
                } else {
                  let res = response[respIdx++];
                  return {
                    status_code: res.status,
                    duration: end - start,
                    metadata: ev.metadata,
                    error: res.err
                  };
                }
              }));
            }
            // we resolve unconditionally to continue the iteration in eachSeries.  errors will cause
            // the event to be re-enqueued/dropped.
            resolve();
          });
      });
    }).then(finishBatch)
      .catch(finishBatch);
  }

  _shouldSendEvent (ev) {
    var { sampleRate } = ev;
    if (sampleRate <= 1) {
      return true;
    }
    return (this._randomFn() < 1/sampleRate);
  }

  _ensureSendTimeout () {
    if (this._sendTimeoutId === -1) {
      this._sendTimeoutId = _global.setTimeout(() => this._sendBatch(), this._batchTimeTrigger);
    }
  }

  _clearSendTimeout () {
    if (this._sendTimeoutId !== -1) {
      _global.clearTimeout(this._sendTimeoutId);
      this._sendTimeoutId = -1;
    }
  }
}
