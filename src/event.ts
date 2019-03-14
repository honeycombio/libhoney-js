// Copyright 2016 Hound Technology, Inc. All rights reserved.
// Use of this source code is governed by the Apache License 2.0
// license that can be found in the LICENSE file.

/**
 * @module
 */
import foreach from "./foreach";
// eslint-disable-next-line sort-imports, no-unused-vars
import Libhoney from "./libhoney";

/**
 * Represents an individual event to send to Honeycomb.
 * @class
 */
export default class Event {
  private _libhoney: Libhoney;
  public data: any;
  public metadata: any;
  public apiHost: string;
  public writeKey: string;
  public dataset: string;
  public sampleRate: number;
  public timestamp: Date
  /**
   * @constructor
   * private
   */
  public constructor(libhoney: Libhoney, fields: any, dynFields: any) {
    this.data = Object.create(null);
    this.metadata = null;

    /**
     * The hostname for the Honeycomb API server to which to send this event.  default:
     * https://api.honeycomb.io/
     *
     * @type {string}
     */
    this.apiHost = "";
    /**
     * The Honeycomb authentication token for this event.  Find your team write key at
     * https://ui.honeycomb.io/account
     *
     * @type {string}
     */
    this.writeKey = "";
    /**
     * The name of the Honeycomb dataset to which to send this event.
     *
     * @type {string}
     */
    this.dataset = "";
    /**
     * The rate at which to sample this event.
     *
     * @type {number}
     */
    this.sampleRate = 1;

    /**
     * If set, specifies the timestamp associated with this event. If unset,
     * defaults to Date.now();
     *
     * @type {Date}
     */
    this.timestamp = null;

    foreach(fields, (v: any, k: string) => this.addField(k, v));
    foreach(dynFields, (v: any, k: string) => this.addField(k, v())); // NOTE: What does v return? Currently my type suggests void but if we are storing something I think it needs to be string|number|boolean

    // stash this away for .send()
    this._libhoney = libhoney;
  }

  /**
   * adds a group of field->values to this event.
   * @param {Object|Map} data field->value mapping.
   * @returns {Event} this event.
   * @example <caption>using an object</caption>
   *   builder.newEvent()
   *     .add ({
   *       responseTime_ms: 100,
   *       httpStatusCode: 200
   *     })
   *     .send();
   * @example <caption>using an ES2015 map</caption>
   *   let map = new Map();
   *   map.set("responseTime_ms", 100);
   *   map.set("httpStatusCode", 200);
   *   let event = honey.newEvent();
   *   event.add (map);
   *   event.send();
   */
  public add(data: object | Map<string, any>): Event {
    foreach(data, (v: any, k: string) => this.addField(k, v));
    return this;
  }

  /**
   * adds a single field->value mapping to this event.
   * @param {string} name
   * @param {any} val
   * @returns {Event} this event.
   * @example
   *   builder.newEvent()
   *     .addField("responseTime_ms", 100)
   *     .send();
   */
  public addField(name: string, val: any): Event {
    if (val === undefined) {
      // eslint-disable-next-line no-param-reassign
      val = null;
    }
    this.data[name] = val;
    return this;
  }

  /**
   * attaches data to an event that is not transmitted to honeycomb, but instead is available when checking the send responses.
   * @param {any} md
   * @returns {Event} this event.
   */
  public addMetadata(md: any): Event {
    this.metadata = md;
    return this;
  }

  /**
   * Sends this event to honeycomb, sampling if necessary.
   */
  public send(): void {
    this._libhoney.sendEvent(this);
  }

  /**
   * Dispatch an event to be sent to Honeycomb.  Assumes sampling has already happened,
   * and will send every event handed to it.
   */
  public sendPresampled(): void {
    this._libhoney.sendPresampledEvent(this);
  }
}
