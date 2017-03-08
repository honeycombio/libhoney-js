// Copyright 2016 Hound Technology, Inc. All rights reserved.
// Use of this source code is governed by the Apache License 2.0
// license that can be found in the LICENSE file.

/**
 * @module
 */
import Event from './event';
import foreach from './foreach';

/**
 * Allows piecemeal creation of events.
 * @class
 */
export default class Builder {
  /**
   * @constructor
   * @private
   */
  constructor (libhoney, fields, dyn_fields) {
    this._libhoney = libhoney;
    this._fields = Object.create(null);
    this._dyn_fields = Object.create(null);

    /**
     * The hostname for the Honeycomb API server to which to send events created through this
     * builder.  default: https://api.honeycomb.io/
     *
     * @type {string}
     */
    this.apiHost = "";
    /**
     * The Honeycomb authentication token. If it is set on a libhoney instance it will be used as the
     * default write key for all events. If absent, it must be explicitly set on a Builder or
     * Event. Find your team write key at https://ui.honeycomb.io/account
     *
     * @type {string}
     */
    this.writeKey = "";
    /**
     * The name of the Honeycomb dataset to which to send these events.  If it is specified during
     * libhoney initialization, it will be used as the default dataset for all events. If absent,
     * dataset must be explicitly set on a builder or event.
     *
     * @type {string}
     */
    this.dataset = "";
    /**
     * The rate at which to sample events. Default is 1, meaning no sampling. If you want to send one
     * event out of every 250 times send() is called, you would specify 250 here.
     *
     * @type {number}
     */
    this.sampleRate = 1;

    foreach(fields, (v,k) => this.addField(k, v));
    foreach(dyn_fields, (v,k) => this.addDynamicField(k, v));
  }

  /**
   * adds a group of field->values to the events created from this builder.
   * @param {Object|Map<string, any>} data field->value mapping.
   * @returns {Builder} this Builder instance.
   * @example <caption>using an object</caption>
   *   var honey = new libhoney();
   *   var builder = honey.newBuilder();
   *   builder.add ({
   *     component: "web",
   *     depth: 200
   *   });
   * @example <caption>using an ES2015 map</caption>
   *   let map = new Map();
   *   map.set("component", "web");
   *   map.set("depth", 200);
   *   builder.add (map);
   */
  add (data) {
    foreach(data, (v,k) => this.addField(k, v));
    return this;
  }

  /**
   * adds a single field->value mapping to the events created from this builder.
   * @param {string} name
   * @param {any} val
   * @returns {Builder} this Builder instance.
   * @example
   *   builder.addField("component", "web");
   */
  addField (name, val) {
    if (typeof val === "object") {
      // JS reports typeof == object for a lot of things that we don't need additional processing to handle
      if (val === null || val instanceof Boolean || val instanceof Number || val instanceof Date || val instanceof String) {
        // these are fine
      } else {
        val = JSON.stringify(val);
      }
    } else if (val == undefined) {
      val = null;
    }
    this._fields[name] = val;
    return this;
  }

  /**
   * adds a single field->dynamic value function, which is invoked to supply values when events are created from this builder.
   * @param {string} name the name of the field to add to events.
   * @param {function(): any} fn the function called to generate the value for this field.
   * @returns {Builder} this Builder instance.
   * @example
   *   builder.addDynamicField("process_heapUsed", () => process.memoryUsage().heapUsed);
   */
  addDynamicField (name, fn) {
    this._dyn_fields[name] = fn;
  }

  /**
   * creates and sends an event, including all builder fields/dyn_fields, as well as anything in the optional data parameter.
   * @param {Object|Map<string, any>} [data] field->value mapping to add to the event sent.
   * @example <caption>empty sendNow</caption>
   *   builder.sendNow(); // sends just the data that has been added via add/addField/addDynamicField.
   * @example <caption>adding data at send-time</caption>
   *   builder.sendNow({
   *     additionalField: value
   *   });
   */
  sendNow (data) {
    var ev = this.newEvent();
    ev.add(data);
    ev.send();
  }

  /**
   * creates and returns a new Event containing all fields/dyn_fields from this builder, that can be further fleshed out and sent on its own.
   * @returns {Event} an Event instance
   * @example <caption>adding data at send-time</caption>
   *   let ev = builder.newEvent();
   *   ev.addField("additionalField", value);
   *   ev.send();
   */
  newEvent () {
    var ev = new Event(this._libhoney, this._fields, this._dyn_fields);
    ev.apiHost = this.apiHost;
    ev.writeKey = this.writeKey;
    ev.dataset = this.dataset;
    ev.sampleRate = this.sampleRate;
    return ev;
  }

  /**
   * creates and returns a clone of this builder, merged with fields and dyn_fields passed as arguments.
   * @param {Object|Map<string, any>} fields a field->value mapping to merge into the new builder.
   * @param {Object|Map<string, any>} dyn_fields a field->dynamic function mapping to merge into the new builder.
   * @returns {Builder} a Builder instance
   * @example <caption>no additional fields/dyn_field</caption>
   *   let anotherBuilder = builder.newBuilder();
   * @example <caption>additional fields/dyn_field</caption>
   *   let anotherBuilder = builder.newBuilder({ requestId },
   *                                           {
   *                                             process_heapUsed: () => process.memoryUsage().heapUsed
   *                                           });
   */
  newBuilder (fields, dyn_fields) {
    var b = new Builder(this._libhoney, this._fields, this._dyn_fields);

    foreach(fields, (v,k) => b.addField(k, v));
    foreach(dyn_fields, (v,k) => b.addDynamicField(k, v));

    b.apiHost = this.apiHost;
    b.writeKey = this.writeKey;
    b.dataset = this.dataset;
    b.sampleRate = this.sampleRate;

    return b;
  }
}
