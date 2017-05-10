// Copyright 2016 Hound Technology, Inc. All rights reserved.
// Use of this source code is governed by the Apache License 2.0
// license that can be found in the LICENSE file.

/**
 * @module
 */
import Transmission from './transmission';
import Builder from './builder';

import { EventEmitter } from 'events';

const defaults = Object.freeze({
  apiHost: "https://api.honeycomb.io/",

  // sample rate of data.  causes us to send 1/sample-rate of events
  // i.e. `sampleRate: 10` means we only send 1/10th the events.
  sampleRate: 1,

  // transmission constructor, or a string "worker"/"base" to pick one of our builtin versions.
  // we fall back to the base impl if worker or a custom implementation throws on init.
  transmission: "base",

  // batch triggers
  batchSizeTrigger: 50,  // we send a batch to the api when we have this many outstanding events
  batchTimeTrigger: 100, // ... or after this many ms has passed.

  // batches are sent serially (one event at a time), so we allow multiple concurrent batches
  // to increase parallelism while sending.
  maxConcurrentBatches: 10,

  // the maximum number of pending events we allow in our to-be-batched-and-transmitted queue before dropping them.
  pendingWorkCapacity: 10000,

  // the maximum number of responses we enqueue before we begin dropping them.
  maxResponseQueueSize: 1000,

  // if this is set to true, all sending is disabled.  useful for disabling libhoney when testing
  disabled: false
});

/**
 * libhoney aims to make it as easy as possible to create events and send them on into Honeycomb.
 *
 * See https://honeycomb.io/docs for background on this library.
 * @class
 */
export default class Libhoney extends EventEmitter {
  /**
   * Constructs a libhoney context in order to configure default behavior,
   * though each of its members (`apiHost`, `writeKey`, `dataset`, and
   * `sampleRate`) may in fact be overridden on a specific Builder or Event.
   *
   * @param {Object} [opts] overrides for the defaults
   * @param {string} [opts.apiHost=https://api.honeycomb.io] - Server host to receive Honeycomb events.
   * @param {string} opts.writeKey - Write key for your Honeycomb team. (Required)
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
   *   writeKey: "YOUR_WRITE_KEY",
   *   dataset: "honeycomb-js-example",
   *   // disabled: true // uncomment when testing or in development
   * });
   */
  constructor (opts) {
    super();
    this._options = Object.assign({ responseCallback: this._responseCallback.bind(this) }, defaults, opts);
    this._transmission = getAndInitTransmission(this._options.transmission, this._options);
    this._usable = this._transmission != null;
    this._builder = new Builder(this);

    this._builder.apiHost = this._options.apiHost;
    this._builder.writeKey = this._options.writeKey;
    this._builder.dataset = this._options.dataset;
    this._builder.sampleRate = this._options.sampleRate;

    this._responseQueue = [];
  }

  _responseCallback (response) {
    let queue = this._responseQueue;
    if (queue.length < this._options.maxResponseQueueSize) {
      queue.push(response);
    }
    this.emit("response", queue);
  }

  /**
   * The hostname for the Honeycomb API server to which to send events created through this libhoney
   * instance. default: https://api.honeycomb.io/
   *
   * @type {string}
   */
  set apiHost(v) {
    this._builder.apiHost = v;
  }
  /**
   * The hostname for the Honeycomb API server to which to send events created through this libhoney
   * instance. default: https://api.honeycomb.io/
   *
   * @type {string}
   */
  get apiHost() {
    return this._builder.apiHost;
  }

  /**
   * The Honeycomb authentication token. If it is set on a libhoney instance it will be used as the
   * default write key for all events. If absent, it must be explicitly set on a Builder or
   * Event. Find your team write key at https://ui.honeycomb.io/account
   *
   * @type {string}
   */
  set writeKey(v) {
    this._builder.writeKey = v;
  }
  /**
   * The Honeycomb authentication token. If it is set on a libhoney instance it will be used as the
   * default write key for all events. If absent, it must be explicitly set on a Builder or
   * Event. Find your team write key at https://ui.honeycomb.io/account
   *
   * @type {string}
   */
  get writeKey() {
    return this._builder.writeKey;
  }

  /**
   * The name of the Honeycomb dataset to which to send events through this libhoney instance.  If
   * it is specified during libhoney initialization, it will be used as the default dataset for all
   * events. If absent, dataset must be explicitly set on a builder or event.
   *
   * @type {string}
   */
  set dataset(v) {
    this._builder.dataset = v;
  }
  /**
   * The name of the Honeycomb dataset to which to send these events through this libhoney instance.
   * If it is specified during libhoney initialization, it will be used as the default dataset for
   * all events. If absent, dataset must be explicitly set on a builder or event.
   *
   * @type {string}
   */
  get dataset() {
    return this._builder.dataset;
  }

  /**
   * The rate at which to sample events. Default is 1, meaning no sampling. If you want to send one
   * event out of every 250 times send() is called, you would specify 250 here.
   *
   * @type {number}
   */
  set sampleRate(v) {
    this._builder.sampleRate = v;
  }
  /**
   * The rate at which to sample events. Default is 1, meaning no sampling. If you want to send one
   * event out of every 250 times send() is called, you would specify 250 here.
   *
   * @type {number}
   */
  get sampleRate() {
    return this._builder.sampleRate;
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
  sendEvent (event) {
    let transmitEvent = this.validateEvent(event);
    if (!transmitEvent) {
      return;
    }
    
    this._transmission.sendEvent(transmitEvent);
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
  sendPresampledEvent (event) {
    let transmitEvent = this.validateEvent(event);
    if (!transmitEvent) {
      return;
    }

    this._transmission.sendPresampledEvent(transmitEvent);
  }

  /**
   * validateEvent takes an event and validates its structure and contents.
   *
   * @returns {Object} the validated libhoney Event. May return undefined if
   *                   the event was invalid in some way or unable to be sent.
   * @private
   */
  validateEvent (event) {
    if (!this._usable) return;

    var timestamp = event.timestamp || Date.now();
    if (typeof timestamp === 'string' || typeof timestamp === 'number')
      timestamp = new Date(timestamp);

    if (typeof event.data !== 'object' || event.data === null) {
      console.error(".data must be an object");
      return;
    }
    var postData;
    try {
      postData = JSON.stringify(event.data);
    }
    catch (e) {
      console.error("error converting event data to JSON: " + e);
      return;
    }

    var apiHost = event.apiHost;
    if (typeof apiHost !== 'string' || apiHost === "") {
      console.error(".apiHost must be a non-empty string");
      return;
    }

    var writeKey = event.writeKey;
    if (typeof writeKey !== 'string' || writeKey === "") {
      console.error(".writeKey must be a non-empty string");
      return;
    }

    var dataset = event.dataset;
    if (typeof dataset !== 'string' || dataset === "") {
      console.error(".dataset must be a non-empty string");
      return;
    }

    var sampleRate = event.sampleRate;
    if (typeof sampleRate !== 'number') {
      console.error(".sampleRate must be a number");
      return;
    }

    var metadata = event.metadata;
    return {
      timestamp,
      apiHost,
      postData,
      writeKey,
      dataset,
      sampleRate,
      metadata
    };
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
  add (data) {
    this._builder.add(data);
    return this;
  }

  /**
   * adds a single field->value mapping to the global Builder.
   * @param {string} name name of field to add.
   * @param {any} val value of field to add.
   * @returns {Libhoney} this libhoney instance.
   * @example
   *   honey.addField("build_id", "a6cc38a1");
   */
  addField (name, val) {
    this._builder.addField(name, val);
    return this;
  }

  /**
   * adds a single field->dynamic value function to the global Builder.
   * @param {string} name name of field to add.
   * @param {function(): any} fn function that will be called to generate the value whenever an event is created.
   * @returns {Libhoney} this libhoney instance.
   * @example
   *   honey.addDynamicField("process_heapUsed", () => process.memoryUsage().heapUsed);
   */
  addDynamicField (name, fn) {
    this._builder.addDynamicField(name, fn);
    return this;
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
  sendNow (data) {
    return this._builder.sendNow(data);
  }

  /**
   * creates and returns a new Event containing all fields/dyn_fields from the global Builder, that can be further fleshed out and sent on its own.
   * @returns {Event} an Event instance
   * @example <caption>adding data at send-time</caption>
   *   let ev = honey.newEvent();
   *   ev.addField("additionalField", value);
   *   ev.send();
   */
  newEvent () {
    return this._builder.newEvent();
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
  newBuilder (fields, dyn_fields) {
    return this._builder.newBuilder(fields, dyn_fields);
  }
}

function getAndInitTransmission(transmission, options) {
  if (options.disabled) {
    return null;
  }

  if (typeof transmission === "string") {
    if (transmission === "base") {
      transmission = Transmission;
    } else if (transmission === "worker") {
      console.warn("worker implementation not ready yet.  using base implementation");
      transmission = Transmission;
    } else {
      throw new Error(`unknown transmission implementation "${transmission}".`);
    }
  } else if (typeof transmission !== "function") {
    throw new Error(".transmission must be one of 'base'/'worker' or a constructor.");
  }

  try {
    return new transmission(options);
  }
  catch (e) {
    if (transmission == Transmission) {
      throw new Error("unable to initialize base transmission implementation.", e);
    }

    console.warn("failed to initialize transmission, falling back to base implementation.");
    try {
      transmission = new Transmission(options);
    }
    catch (e) {
      throw new Error("unable to initialize base transmission implementation.", e);
    }
  }

  return transmission;
}
