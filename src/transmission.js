// Copyright 2016 Hound Technology, Inc. All rights reserved.
// Use of this source code is governed by the Apache License 2.0
// license that can be found in the LICENSE file.

/* global require, window, global */

/**
 * @module
 */
let superagent = require('superagent');
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
    this._responseCallback({
      metadata: ev.metadata,
      error: new Error(reason)
    });
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

    eachPromise(batch, (ev) => {
      var url = urljoin(ev.apiHost, "/1/events", ev.dataset);
      var req = superagent.post(url);

      return new Promise( (resolve) => {
        var start = Date.now();
        req
          .set('X-Hny-Team', ev.writeKey)
          .set('X-Hny-Samplerate', ev.sampleRate)
          .set('X-Hny-Event-Time', ev.timestamp.toISOString())
          .set('User-Agent', userAgent)
          .type("json")
          .send(ev.postData)
          .end((err, res) => {
            // call a callback here (in our init options) so it can be used both in the node, browser, and worker contexts.
            this._responseCallback({
              status_code: res ? res.status : err.status,
              duration: Date.now() - start,
              metadata: ev.metadata,
              error: err
            });

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
