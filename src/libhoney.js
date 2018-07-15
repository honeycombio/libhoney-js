// Copyright 2016 Hound Technology, Inc. All rights reserved.
// Use of this source code is governed by the Apache License 2.0
// license that can be found in the LICENSE file.

// jshint esversion: 6
/**
 * @module
 */
import BoardsClient from "./api/boards/client";
import EventsClient from "./api/events/client";
import TriggersClient from "./api/triggers/client";

const defaults = Object.freeze({
  apiHost: "https://api.honeycomb.io/",

  // sample rate of data.  causes us to send 1/sample-rate of events
  // i.e. `sampleRate: 10` means we only send 1/10th the events.
  sampleRate: 1,

  // transmission constructor, or a string to pick one of our builtin versions.
  // we fall back to the base impl if worker or a custom implementation throws on init.
  // string options available are:
  //  - "base": the default transmission implementation
  //  - "worker": a web-worker based transmission (not currently available, see https://github.com/honeycombio/libhoney-js/issues/22)
  //  - "mock": an implementation that accumulates all events sent
  //  - "writer": an implementation that logs to the console all events sent
  //  - "null": an implementation that does nothing
  transmission: "base",

  // batch triggers
  batchSizeTrigger: 50, // we send a batch to the api when we have this many outstanding events
  batchTimeTrigger: 100, // ... or after this many ms has passed.

  // batches are sent serially (one event at a time), so we allow multiple concurrent batches
  // to increase parallelism while sending.
  maxConcurrentBatches: 10,

  // the maximum number of pending events we allow in our to-be-batched-and-transmitted queue before dropping them.
  pendingWorkCapacity: 10000,

  // the maximum number of responses we enqueue before we begin dropping them.
  maxResponseQueueSize: 1000,

  // if this is set to true, all sending is disabled.  useful for disabling libhoney when testing
  disabled: false,

  // If this is non-empty, append it to the end of the User-Agent header.
  userAgentAddition: ""
});

/**
 * libhoney aims to make it as easy as possible to create events and send them on into Honeycomb.
 *
 * See https://honeycomb.io/docs for background on this library.
 * @class
 */
export default class Libhoney {
  /**
   * Constructs a libhoney context in order to configure default behavior,
   * though each of its members (`apiHost`, `apiKey`, `dataset`, and
   * `sampleRate`) may in fact be overridden on a specific Builder or Event.
   *
   * @param {Object} [opts] overrides for the defaults
   * @param {string} [opts.apiHost=https://api.honeycomb.io] - Server host to receive Honeycomb events.
   * @param {string} opts.apiKey - API key for your Honeycomb team. (Required)
   * @param {string} opts.dataset - Name of the dataset that should contain this event. The dataset will be created for your team if it doesn't already exist.
   * @param {number} [opts.sampleRate=1] - Sample rate of data. If set, causes us to send 1/sampleRate of events and drop the rest.
   * @param {number} [opts.batchSizeTrigger=50] - We send a batch to the API when this many outstanding events exist in our event queue.
   * @param {number} [opts.batchTimeTrigger=100] - We send a batch to the API after this many milliseconds have passed.
   * @param {number} [opts.maxConcurrentBatches=10] - We process batches concurrently to increase parallelism while sending.
   * @param {number} [opts.pendingWorkCapacity=10000] - The maximum number of pending events we allow to accumulate in our sending queue before dropping them.
   * @param {number} [opts.maxResponseQueueSize=1000] - The maximum number of responses we enqueue before dropping them.
   * @param {boolean} [opts.disabled=false] - Disable transmission of events to the specified `apiHost`, particularly useful for testing or development.
   * @constructor
   * @example
   * import Libhoney from 'libhoney';
   * let honey = new Libhoney({
   *   apiKey: "YOUR_API_KEY",
   *   dataset: "honeycomb-js-example",
   *   // disabled: true // uncomment when testing or in development
   * });
   */
  constructor(opts) {
    this._options = Object.assign({}, defaults, opts);

    this._apiHost = this._options.apiHost;
    this._apiKey = this._options.apiKey;

    this.events = new EventsClient(this._options);
    this.boards = new BoardsClient(this._options);
    this.triggers = new TriggersClient(this._options);
  }

  /**
   * The hostname for the Honeycomb API server to which to send events created through this libhoney
   * instance. default: https://api.honeycomb.io/
   *
   * @type {string}
   */
  set apiHost(v) {
    this._apiHost = v;
    // update all the clients
    this.event.apiHost = v;
    this.boards.apiHost = v;
    this.triggers.apiHost = v;
  }
  /**
   * The hostname for the Honeycomb API server to which to send events created through this libhoney
   * instance. default: https://api.honeycomb.io/
   *
   * @type {string}
   */
  get apiHost() {
    return this._apiHost;
  }

  /**
   * The Honeycomb authentication token. If it is set on a libhoney instance it will be used as the
   * default api key for all events. If absent, it must be explicitly set on a Builder or
   * Event. Find your team api key at https://ui.honeycomb.io/account
   *
   * @type {string}
   */
  set apiKey(v) {
    this.apiKey = v;
    // update all the clients
    this.event.apiKey = v;
    this.boards.apiKey = v;
    this.triggers.apiKey = v;
  }

  /**
   * The Honeycomb authentication token. If it is set on a libhoney instance it will be used as the
   * default api key for all events. If absent, it must be explicitly set on a Builder or
   * Event. Find your team api key at https://ui.honeycomb.io/account
   *
   * @type {string}
   */
  get apiKey() {
    return this._apiKey;
  }
}

// this will absolutely go away with the next major version bump.  right now in normal node (CJS) usage,
// users have to do:  `let Libhoney = require("libhoney").default;`
//
// switching to rollup fixes that (yay!) but we need to keep it working until  we do the major bump.  hence
// this hack.
if (typeof module !== "undefined") {
  Object.defineProperty(Libhoney, "default", { value: Libhoney });
}
