// Copyright 2016 Hound Technology, Inc. All rights reserved.
// Use of this source code is governed by the Apache License 2.0
// license that can be found in the LICENSE file.

/**
 * @module
 */
import BoardsClient from "./api/boards/client";
import DatasetsClient from "./api/datasets/client";
import EventsClient from "./api/events/client";
import MarkersClient from "./api/markers/client";
import QueryResultsClient from "./api/markers/queryResults";
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
   * @param {string} opts.writeKey - (deprecated) API key for your Honeycomb team.
   * @param {string} opts.dataset - For dataset scoped clients (events, markers), the name of the dataset that should contain the resource.  If sending events, the dataset will be created if not present.
   * @param {number} [opts.sampleRate=1] - Sample rate of data. If set, causes us to send 1/sampleRate of events and drop the rest.
   * @param {number} [opts.batchSizeTrigger=50] - We send a batch to the API when this many outstanding events exist in our event queue.
   * @param {number} [opts.batchTimeTrigger=100] - We send a batch to the API after this many milliseconds have passed.
   * @param {number} [opts.maxConcurrentBatches=10] - We process batches concurrently to increase parallelism while sending.
   * @param {number} [opts.pendingWorkCapacity=10000] - The maximum number of pending events we allow to accumulate in our sending queue before dropping them.
   * @param {number} [opts.maxResponseQueueSize=1000] - The maximum number of responses we enqueue before dropping them.
   * @param {boolean} [opts.disabled=false] - Disable communication to the specified `apiHost`, particularly useful for testing or development.
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

    if (this._options.writeKey && typeof this._options.apiKey === "undefined") {
      // fall back to writeKey if apiKey isn't present
      this._options.apiKey = this._options.writeKey;
    }
  }

  /**
   * The hostname for the Honeycomb API server to which to send events created through this libhoney
   * instance. default: https://api.honeycomb.io/
   *
   * @type {string}
   */
  set apiHost(v) {
    this._options.apiHost = v;

    // update all the clients
    if (this._boards) {
      this._boards.apiHost = v;
    }
    if (this._datasets) {
      this._datasets.apiHost = v;
    }
    if (this._events) {
      this._events.apiHost = v;
    }
    if (this._markers) {
      this._markers.apiHost = v;
    }
    if (this._queryResults) {
      this._queryResults.apiHost = v;
    }
    if (this._triggers) {
      this._triggers.apiHost = v;
    }
  }
  /**
   * The hostname for the Honeycomb API server to which to send events created through this libhoney
   * instance. default: https://api.honeycomb.io/
   *
   * @type {string}
   */
  get apiHost() {
    return this._options.apiHost;
  }

  /**
   * The Honeycomb authentication token. If it is set on a libhoney instance it will be used as the
   * default api key for all events. If absent, it must be explicitly set on a Builder or
   * Event. Find your team api key at https://ui.honeycomb.io/account
   *
   * @type {string}
   */
  set apiKey(v) {
    this._options.apiKey = v;

    // update all the clients
    if (this._boards) {
      this._boards.apiKey = v;
    }
    if (this._datasets) {
      this._datasets.apiKey = v;
    }
    if (this._events) {
      this._events.apiKey = v;
    }
    if (this._markers) {
      this._markers.apiKey = v;
    }
    if (this._queryResults) {
      this._queryResults.apiKey = v;
    }
    if (this._triggers) {
      this._triggers.apiKey = v;
    }
  }

  /**
   * The Honeycomb authentication token. If it is set on a libhoney instance it will be used as the
   * default api key for all events. If absent, it must be explicitly set on a Builder or
   * Event. Find your team api key at https://ui.honeycomb.io/account
   *
   * @type {string}
   */
  get apiKey() {
    return this.options._apiKey;
  }

  get boards() {
    if (!this._boards) {
      this._boards = new BoardsClient(this._options);
    }
    return this._boards;
  }

  get datasets() {
    if (!this._datasets) {
      this._datasets = new DatasetsClient(this._options);
    }
    return this._datasets;
  }

  get events() {
    if (!this._events) {
      this._events = new EventsClient(this._options);
    }
    return this._events;
  }

  get markers() {
    if (!this._markers) {
      this._markers = new MarkersClient(this._options);
    }
    return this._markers;
  }

  get queryResults() {
    if (!this._queryResults) {
      this._queryResults = new QueryResultsClient(this._options);
    }
    return this._queryResults;
  }

  get triggers() {
    if (!this._triggers) {
      this._triggers = new TriggersClient(this._options);
    }
    return this._triggers;
  }

  // deprecated writeKey accessors.  will go away with the next major version bump
  set writeKey(v) {
    this.apiKey = v;
  }

  get writeKey() {
    return this.apiKey;
  }

  // proxies for the events client.  these _may_ go away in a future major release.
  /**
   * The rate at which to sample events. Default is 1, meaning no sampling. If you want to send one
   * event out of every 250 times send() is called, you would specify 250 here.
   *
   * @type {number}
   */
  set sampleRate(v) {
    this.events.sampleRate = v;
  }
  /**
   * The rate at which to sample events. Default is 1, meaning no sampling. If you want to send one
   * event out of every 250 times send() is called, you would specify 250 here.
   *
   * @type {number}
   */
  get sampleRate() {
    return this.events.sampleRate;
  }

  /**
   *  sendEvent takes events of the following form:
   *
   * {
   *   data: a JSON-serializable object, keys become colums in Honeycomb
   *   timestamp [optional]: time for this event, defaults to now()
   *   writeKey [optional]: your team's write key.  overrides the libhoney instance's value.
   *   dataset [optional]: the data set name.  overrides the libhoney instance's value.
   *   sampleRate [optional]: cause us to send 1 out of sampleRate events.  overrides the libhoney instance's value.
   * }
   *
   * Sampling is done based on the supplied sampleRate, so events passed to this method might not
   * actually be sent to Honeycomb.
   * @private
   */
  sendEvent(event) {
    return this.events.sendEvent(event);
  }

  /**
   *  sendPresampledEvent takes events of the following form:
   *
   * {
   *   data: a JSON-serializable object, keys become colums in Honeycomb
   *   timestamp [optional]: time for this event, defaults to now()
   *   writeKey [optional]: your team's write key.  overrides the libhoney instance's value.
   *   dataset [optional]: the data set name.  overrides the libhoney instance's value.
   *   sampleRate: the rate this event has already been sampled.
   * }
   *
   * Sampling is presumed to have already been done (at the supplied sampledRate), so all events passed to this method
   * are sent to Honeycomb.
   * @private
   */
  sendPresampledEvent(event) {
    return this.events.sendPresampledEvent(event);
  }

  /**
   * validateEvent takes an event and validates its structure and contents.
   *
   * @returns {Object} the validated libhoney Event. May return undefined if
   *                   the event was invalid in some way or unable to be sent.
   * @private
   */
  validateEvent(event) {
    return this.events.validateEvent(event);
  }

  /**
   * adds a group of field->values to the global Builder.
   * @param {Object|Map<string, any>} data field->value mapping.
   * @returns {Libhoney} this libhoney instance.
   * @example <caption>using an object</caption>
   *   honey.add ({
   *     buildID: "a6cc38a1",
   *     env: "staging"
   *   });
   * @example <caption>using an ES2015 map</caption>
   *   let map = new Map();
   *   map.set("build_id", "a6cc38a1");
   *   map.set("env", "staging");
   *   honey.add (map);
   */
  add(data) {
    return this.events.add(data);
  }

  /**
   * adds a single field->value mapping to the global Builder.
   * @param {string} name name of field to add.
   * @param {any} val value of field to add.
   * @returns {Libhoney} this libhoney instance.
   * @example
   *   honey.addField("build_id", "a6cc38a1");
   */
  addField(name, val) {
    return this.events.addField(name, val);
  }

  /**
   * adds a single field->dynamic value function to the global Builder.
   * @param {string} name name of field to add.
   * @param {function(): any} fn function that will be called to generate the value whenever an event is created.
   * @returns {Libhoney} this libhoney instance.
   * @example
   *   honey.addDynamicField("process_heapUsed", () => process.memoryUsage().heapUsed);
   */
  addDynamicField(name, fn) {
    return this.events.addDynamicField(name, fn);
  }

  /**
   * creates and sends an event, including all global builder fields/dyn_fields, as well as anything in the optional data parameter.
   * @param {Object|Map<string, any>} data field->value mapping.
   * @example <caption>using an object</caption>
   *   honey.sendNow ({
   *     responseTime_ms: 100,
   *     httpStatusCode: 200
   *   });
   * @example <caption>using an ES2015 map</caption>
   *   let map = new Map();
   *   map.set("responseTime_ms", 100);
   *   map.set("httpStatusCode", 200);
   *   honey.sendNow (map);
   */
  sendNow(data) {
    return this.events.sendNow(data);
  }
  /**
   * creates and returns a new Event containing all fields/dyn_fields from the global Builder, that can be further fleshed out and sent on its own.
   * @returns {Event} an Event instance
   * @example <caption>adding data at send-time</caption>
   *   let ev = honey.newEvent();
   *   ev.addField("additionalField", value);
   *   ev.send();
   */
  newEvent() {
    return this.events.newEvent();
  }

  /**
   * creates and returns a clone of the global Builder, merged with fields and dyn_fields passed as arguments.
   * @param {Object|Map<string, any>} fields a field->value mapping to merge into the new builder.
   * @param {Object|Map<string, any>} dyn_fields a field->dynamic function mapping to merge into the new builder.
   * @returns {Builder} a Builder instance
   * @example <caption>no additional fields/dyn_field</caption>
   *   let builder = honey.newBuilder();
   * @example <caption>additional fields/dyn_field</caption>
   *   let builder = honey.newBuilder({ requestId },
   *                                  {
   *                                    process_heapUsed: () => process.memoryUsage().heapUsed
   *                                  });
   */
  newBuilder(fields, dyn_fields) {
    return this.events.newBuilder(fields, dyn_fields);
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

// this will absolutely go away with the next major version bump.  right now in normal node (CJS) usage,
// users have to do:  `let Libhoney = require("libhoney").default;`
//
// switching to rollup fixes that (yay!) but we need to keep it working until  we do the major bump.  hence
// this hack.
if (typeof module !== "undefined") {
  Object.defineProperty(Libhoney, "default", { value: Libhoney });
}
