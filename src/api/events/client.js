import {
  Transmission,
  MockTransmission,
  WriterTransmission,
  NullTransmission,
  ValidatedEvent
} from "./transmission";
import Builder from "./builder";

import { EventEmitter } from "events";

export default class Client extends EventEmitter {
  constructor(options) {
    super();

    this._options = Object.assign(
      { responseCallback: this._responseCallback.bind(this) },
      options
    );

    this._transmission = getAndInitTransmission(
      this._options.transmission,
      this._options
    );
    this._usable = this._transmission !== null;
    this._builder = new Builder(this);

    Object.assign(this._builder, {
      apiHost: this._options.apiHost,
      apiKey: this._options.apiKey,
      dataset: this._options.dataset,
      sampleRate: this._options.sampleRate
    });

    this._responseQueue = [];
  }

  _responseCallback(responses) {
    let queue = this._responseQueue;
    if (queue.length < this._options.maxResponseQueueSize) {
      this._responseQueue = this._responseQueue.concat(responses);
    }
    this.emit("response", this._responseQueue);
  }

  set apiHost(v) {
    this._builder.apiHost = v;
  }

  get apiHost() {
    return this._builder.apiHost;
  }

  set apiKey(v) {
    this._builder.apiKey = v;
  }

  get apiKey() {
    return this._builder.apiKey;
  }

  /**
   * The transmission implementation in use for this libhoney instance.  Useful when mocking libhoney (specify
   * "mock" for options.transmission, and use this field to get at the list of events sent through libhoney.)
   */
  get transmission() {
    return this._transmission;
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
   *   apiKey [optional]: your team's api key.  overrides the libhoney instance's value.
   *   dataset [optional]: the data set name.  overrides the libhoney instance's value.
   *   sampleRate [optional]: cause us to send 1 out of sampleRate events.  overrides the libhoney instance's value.
   * }
   *
   * Sampling is done based on the supplied sampleRate, so events passed to this method might not
   * actually be sent to Honeycomb.
   * @private
   */
  sendEvent(event) {
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
   *   apiKey [optional]: your team's api key.  overrides the libhoney instance's value.
   *   dataset [optional]: the data set name.  overrides the libhoney instance's value.
   *   sampleRate: the rate this event has already been sampled.
   * }
   *
   * Sampling is presumed to have already been done (at the supplied sampledRate), so all events passed to this method
   * are sent to Honeycomb.
   * @private
   */
  sendPresampledEvent(event) {
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
  validateEvent(event) {
    if (!this._usable) return null;

    let timestamp = event.timestamp || Date.now();
    if (typeof timestamp === "string" || typeof timestamp === "number")
      timestamp = new Date(timestamp);

    if (typeof event.data !== "object" || event.data === null) {
      console.error(".data must be an object");
      return null;
    }
    let postData;
    try {
      postData = JSON.stringify(event.data);
    } catch (e) {
      console.error("error converting event data to JSON: " + e);
      return null;
    }

    let apiHost = event.apiHost;
    if (typeof apiHost !== "string" || apiHost === "") {
      console.error(".apiHost must be a non-empty string");
      return null;
    }

    let apiKey = event.apiKey;
    if (typeof apiKey !== "string" || apiKey === "") {
      console.error(".apiKey must be a non-empty string");
      return null;
    }

    let dataset = event.dataset;
    if (typeof dataset !== "string" || dataset === "") {
      console.error(".dataset must be a non-empty string");
      return null;
    }

    let sampleRate = event.sampleRate;
    if (typeof sampleRate !== "number") {
      console.error(".sampleRate must be a number");
      return null;
    }

    let metadata = event.metadata;
    return new ValidatedEvent({
      timestamp,
      apiHost,
      postData,
      apiKey,
      dataset,
      sampleRate,
      metadata
    });
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
  addField(name, val) {
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
  addDynamicField(name, fn) {
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
  sendNow(data) {
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
  newEvent() {
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
  newBuilder(fields, dyn_fields) {
    return this._builder.newBuilder(fields, dyn_fields);
  }
}

function getAndInitTransmission(transmission, options) {
  if (options.disabled) {
    return null;
  }

  if (typeof transmission === "string") {
    switch (transmission) {
      case "base":
        transmission = Transmission;
        break;
      case "worker":
        console.warn(
          "worker implementation not ready yet.  using base implementation"
        );
        transmission = Transmission;
        break;
      case "mock":
        transmission = MockTransmission;
        break;
      case "writer":
        transmission = WriterTransmission;
        break;
      case "null":
        transmission = NullTransmission;
        break;
      default:
        throw new Error(
          `unknown transmission implementation "${transmission}".`
        );
    }
  } else if (typeof transmission !== "function") {
    throw new Error(
      ".transmission must be one of 'base'/'worker'/'mock'/'writer'/'null' or a constructor."
    );
  }

  try {
    return new transmission(options);
  } catch (e) {
    if (transmission == Transmission) {
      throw new Error(
        "unable to initialize base transmission implementation.",
        e
      );
    }

    console.warn(
      "failed to initialize transmission, falling back to base implementation."
    );
    try {
      transmission = new Transmission(options);
    } catch (e) {
      throw new Error(
        "unable to initialize base transmission implementation.",
        e
      );
    }
  }

  return transmission;
}
