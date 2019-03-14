/* eslint-disable sort-imports */
// Copyright 2016 Hound Technology, Inc. All rights reserved.
// Use of this source code is governed by the Apache License 2.0
// license that can be found in the LICENSE file.

/**
 * @module
 */
import Event from "./event";
import foreach from "./foreach";
// eslint-disable-next-line no-unused-vars
import Libhoney from "./libhoney";

/**
 * Allows piecemeal creation of events.
 * @class
 */
export default class Builder {
  public apiHost: string;
  public writeKey: string;
  public dataset: string;
  public sampleRate: number;
  private _libhoney: any;
  public _fields: any;
  public _dynFields: any;


  public constructor(libhoney: Libhoney, fields?: object|Map<string, any>, dynFields?: object|Map<string, Function>) {
    this._libhoney = libhoney;
    this._fields = Object.create(null);
    this._dynFields = Object.create(null);

    /**
     * The hostname for the Honeycomb API server to which to send events created through this
     * builder.  default: https://api.honeycomb.io/
     */
    this.apiHost = "";
    /**
     * The Honeycomb authentication token. If it is set on a libhoney instance it will be used as the
     * default write key for all events. If absent, it must be explicitly set on a Builder or
     * Event. Find your team write key at https://ui.honeycomb.io/account
     */
    this.writeKey = "";
    /**
     * The name of the Honeycomb dataset to which to send these events.  If it is specified during
     * libhoney initialization, it will be used as the default dataset for all events. If absent,
     * dataset must be explicitly set on a builder or event.
     */
    this.dataset = "";
    /**
     * The rate at which to sample events. Default is 1, meaning no sampling. If you want to send one
     * event out of every 250 times send() is called, you would specify 250 here.
     */
    this.sampleRate = 1;

    foreach(fields, (v: any, k: string) => this.addField(k, v));
    foreach(dynFields, (v: any, k: string) => this.addDynamicField(k, v));
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
  public add(data: object | Map<string, any>): Builder {
    foreach(data, (v: any, k: string) => this.addField(k, v));
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
  public addField(name: string, val: any): Builder {
    if (val === undefined) {
      // eslint-disable-next-line no-param-reassign
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
  public addDynamicField(name: string, fn: () => (string|boolean|number)): Builder {
    this._dynFields[name] = fn;
    return this;
  }

  /**
   * creates and sends an event, including all builder fields/dynFields, as well as anything in the optional data parameter.
   * @param {Object|Map<string, any>} [data] field->value mapping to add to the event sent.
   * @example <caption>empty sendNow</caption>
   *   builder.sendNow(); // sends just the data that has been added via add/addField/addDynamicField.
   * @example <caption>adding data at send-time</caption>
   *   builder.sendNow({
   *     additionalField: value
   *   });
   */
  public sendNow(data: object | Map<string, any>): void {
    let ev = this.newEvent();
    ev.add(data);
    ev.send();
  }

  /**
   * creates and returns a new Event containing all fields/dynFields from this builder, that can be further fleshed out and sent on its own.
   * @returns {Event} an Event instance
   * @example <caption>adding data at send-time</caption>
   *   let ev = builder.newEvent();
   *   ev.addField("additionalField", value);
   *   ev.send();
   */
  public newEvent(): Event {
    let ev = new Event(this._libhoney, this._fields, this._dynFields);
    ev.apiHost = this.apiHost;
    ev.writeKey = this.writeKey;
    ev.dataset = this.dataset;
    ev.sampleRate = this.sampleRate;
    return ev;
  }

  /**
   * creates and returns a clone of this builder, merged with fields and dynFields passed as arguments.
   * @param {Object|Map<string, any>} fields a field->value mapping to merge into the new builder.
   * @param {Object|Map<string, any>} dynFields a field->dynamic function mapping to merge into the new builder.
   * @returns {Builder} a Builder instance
   * @example <caption>no additional fields/dyn_field</caption>
   *   let anotherBuilder = builder.newBuilder();
   * @example <caption>additional fields/dyn_field</caption>
   *   let anotherBuilder = builder.newBuilder({ requestId },
   *                                           {
   *                                             process_heapUsed: () => process.memoryUsage().heapUsed
   *                                           });
   */
  public newBuilder(fields: object | Map<string, any>, dynFields: object | Map<string, Function>): Builder {
    let b = new Builder(this._libhoney, this._fields, this._dynFields);

    foreach(fields, (v: any, k: string) => b.addField(k, v));
    foreach(dynFields, (v: any, k: string) => b.addDynamicField(k, v));

    b.apiHost = this.apiHost;
    b.writeKey = this.writeKey;
    b.dataset = this.dataset;
    b.sampleRate = this.sampleRate;

    return b;
  }
}
