// Copyright 2016 Hound Technology, Inc. All rights reserved.
// Use of this source code is governed by the Apache License 2.0
// license that can be found in the LICENSE file.

/**
 * @module
 */
import Libhoney from "./libhoney";
import { ValidatedEventData } from "./transmission";
import foreach from "./foreach";

/** Arbitrary data to add to an event. */
export type EventData = Map<string, unknown> | Record<string, unknown>;

/** Arbitrary dynamic data to add to an event. */
export type DynamicEventData =
  | Map<string, () => unknown>
  | Record<string, () => unknown>;

/**
 * Represents an individual event to send to Honeycomb.
 * @class
 */
export default class Event implements Omit<ValidatedEventData, "postData"> {
  /**
   * The hostname for the Honeycomb API server to which to send this event.  default:
   * https://api.honeycomb.io/
   */
  apiHost = "";

  /**
   * The Honeycomb authentication token for this event.  Find your team write key at
   * https://ui.honeycomb.io/account
   */
  writeKey = "";

  /**
   * The name of the Honeycomb dataset to which to send this event.
   */
  dataset = "";

  /**
   * The rate at which to sample this event.
   */
  sampleRate = 1;

  /**
   * If set, specifies the timestamp associated with this event. If unset,
   * defaults to Date.now();
   */
  timestamp: Date = null;

  data: Record<string, unknown> = Object.create(null);

  metadata: unknown = null;

  /**
   * @constructor
   * private
   * @todo if this is supposed to be private, split into public interface and private implementation?
   */
  constructor(
    // stash this away for .send()
    private readonly _libhoney: Libhoney,
    fields: EventData,
    dynFields: DynamicEventData
  ) {
    foreach(fields, (v, k) => this.addField(k, v));
    foreach(dynFields, (v, k) => this.addField(k, v()));
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
  add(data: EventData): Event {
    foreach(data, (v, k) => this.addField(k, v));
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
  addField(name: string, val: unknown): Event {
    if (val === undefined) {
      this.data[name] = null;
      return this;
    }
    this.data[name] = val;
    return this;
  }

  /**
   * attaches data to an event that is not transmitted to honeycomb, but instead is available when checking the send responses.
   * @param {any} md
   * @returns {Event} this event.
   */
  addMetadata(md: unknown): Event {
    this.metadata = md;
    return this;
  }

  /**
   * Sends this event to honeycomb, sampling if necessary.
   */
  send(): void {
    this._libhoney.sendEvent(this);
  }

  /**
   * Dispatch an event to be sent to Honeycomb.  Assumes sampling has already happened,
   * and will send every event handed to it.
   */
  sendPresampled(): void {
    this._libhoney.sendPresampledEvent(this);
  }
}
