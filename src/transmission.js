// Copyright 2016 Hound Technology, Inc. All rights reserved.
// Use of this source code is governed by the Apache License 2.0
// license that can be found in the LICENSE file.

/**
 * @module
 */
let superagent = require('superagent');
import urljoin from 'urljoin';

const libhoney_js_version = "LIBHONEY_JS_VERSION";

// default triggers for sending a batch:
const batchSizeTrigger = 100; // either when the eventQueue is > this length
const batchTimeTrigger = 100; // or it's been more than this many ms since the first push

const emptyResponseCallback = function() { };

/**
 * @private
 */
export default class Transmission {

  constructor (options) {
    this._responseCallback = emptyResponseCallback;
    this._batchSizeTrigger = batchSizeTrigger;
    this._batchTimeTrigger = batchTimeTrigger;
    this._sendTimeoutId = -1;
    this._eventQueue = [];
    // Included for testing; to stub out randomness and verify that an event
    // was dropped.
    this._randomFn = Math.random;
    this._droppedCallback = emptyResponseCallback;

    if (typeof options.responseCallback == "function") {
      this._responseCallback = options.responseCallback;
    }
    if (typeof options.batchSizeTrigger == "number") {
      this._batchSizeTrigger = options.batchSizeTrigger;
    }
    if (typeof options.batchTimeTrigger == "number") {
      this._batchTimeTrigger = options.batchTimeTrigger;
    }
  }

  sendEvent (ev) {
    // bail early if we aren't sampling this event
    if (!this._shouldSendEvent(ev)) {
      this._droppedCallback();
      return;
    }

    this._eventQueue.push(ev);
    if (this._eventQueue.length > this._batchSizeTrigger) {
      this._sendBatch();
    } else {
      this._ensureSendTimeout();
    }
  }

  _sendBatch () {
    this._clearSendTimeout();

    var batch = this._eventQueue.splice(0, this._batchSizeTrigger);

    for (var ev of batch) {
      var url = urljoin(ev.apiHost, "/1/events", ev.dataset);
      var req = superagent.post(url);
      req
        .set('X-Hny-Team', ev.writeKey)
        .set('X-Hny-Samplerate', ev.sampleRate)
        .set('X-Hny-Event-Time', ev.timestamp.toISOString())
        .set('User-Agent', `libhoney-js/${libhoney_js_version}`)
        .type("json")
        .send(ev.postData)
        .end((err, res) => {
          // call a callback here (in our init options) so it can be used both in the node, browser, and worker contexts.
          this._responseCallback({ stuff: "goes here" }); // XXX(toshok)
        });
    }
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
      this._sendTimeoutId = setTimeout(() => this._sendBatch(), this._batchTimeTrigger);
    }
  }

  _clearSendTimeout () {
    if (this._sendTimeoutId !== -1) {
      clearTimeout(this._sendTimeoutId);
      this._sendTimeoutId = -1;
    }
  }
}
