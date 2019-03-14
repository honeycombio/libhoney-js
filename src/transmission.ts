// Copyright 2016 Hound Technology, Inc. All rights reserved.
// Use of this source code is governed by the Apache License 2.0
// license that can be found in the LICENSE file.

/* global window, global */

// eslint-disable-next-line no-unused-vars
import { Response, ResponseError } from "superagent";
import proxy from "superagent-proxy";
import superagent from "superagent";
import urljoin from "url-join";

const USER_AGENT = "libhoney-js/<@LIBHONEY_JS_VERSION@>";

const _global =
  typeof window !== "undefined"
    ? window
    : typeof global !== "undefined"
      ? global
      : undefined;


interface Batch {
  apiHost: string;
  writeKey: string;
  dataset: string;
  events: ValidatedEvent[];
}

interface Batches {
  [key: string]: Batch;
}

class BatchEndpointAggregator {
  public batches: Batches;

  public constructor(events: ValidatedEvent[]) {
    this.batches = BatchEndpointAggregator.partition(
      events,
      ev => `${ev.apiHost}_${ev.writeKey}_${ev.dataset}`,
      ev => ({
        apiHost: ev.apiHost,
        writeKey: ev.writeKey,
        dataset: ev.dataset,
        events: [ev]
      }),
      (batch, ev) => batch.events.push(ev)
    );
  }

  public encodeBatchEvents(events: ValidatedEvent[]): { encoded: string; numEncoded: number }{
    let first = true;
    let numEncoded = 0;
    let encodedEvents = events.reduce((acc, ev) => {
      try {
        let encodedEvent = ev.toJSON();
        numEncoded++;
        let newAcc = acc + (!first ? "," : "") + encodedEvent;
        first = false;
        return newAcc;
      } catch (e) {
        ev.encodeError = e;
        return acc;
      }
    }, "");

    let encoded = "[" + encodedEvents + "]";
    return { encoded, numEncoded };
  }

  private static partition(
    inputEvents: ValidatedEvent[],
    keyFn: (ev: ValidatedEvent) => string,
    createFn: (ev: ValidatedEvent) => Batch,
    addFn: (batch: Batch, ev: ValidatedEvent) => void): Batches {
    let result = Object.create(null);
    inputEvents.forEach(ev => {
      let key = keyFn(ev);
      if (!result[key]) {
        result[key] = createFn(ev);
      } else {
        addFn(result[key], ev);
      }
    });
    return result;
  }
}

interface ValidatedEventInput {
  timestamp: Date;
  apiHost: string;
  postData: string;
  writeKey: string;
  dataset: string;
  sampleRate: number;
  metadata?: object;
}

/**
 * @private
 */
export class ValidatedEvent {
  public timestamp: Date;
  public apiHost: string;
  public postData: string;
  public writeKey: string;
  public dataset: string;
  public sampleRate: number;
  public metadata: object;
  public encodeError?: Error;

  public constructor(eventData: ValidatedEventInput) {
    this.timestamp = eventData.timestamp;
    this.apiHost = eventData.apiHost;
    this.postData = eventData.postData;
    this.writeKey = eventData.writeKey;
    this.dataset = eventData.dataset;
    this.sampleRate = eventData.sampleRate;
    this.metadata = eventData.metadata;
  }

  public toJSON(): string {
    let fields = [];
    if (this.timestamp) {
      fields.push(`"time":${JSON.stringify(this.timestamp)}`);
    }
    if (this.sampleRate) {
      fields.push(`"samplerate":${JSON.stringify(this.sampleRate)}`);
    }
    if (this.postData) {
      fields.push(`"data":${this.postData}`);
    }
    return `{${fields.join(",")}}`;
  }
}

export abstract class Transmission {
  public events: ValidatedEvent[];
  abstract sendEvent(ev: ValidatedEvent): void;
  abstract sendPresampledEvent(ev: ValidatedEvent): void;
}

export class MockTransmission extends Transmission {
  public constructorArg: object;
  public events: ValidatedEvent[];

  public constructor(options: object) {
    super();
    this.constructorArg = options;
    this.events = [];
  }

  public sendEvent(ev: ValidatedEvent): void {
    this.events.push(ev);
  }

  public sendPresampledEvent(ev: ValidatedEvent): void {
    this.events.push(ev);
  }

  public reset(): void {
    this.constructorArg = null;
    this.events = [];
  }
}

export class WriterTransmission extends Transmission {
  private options: object;

  public constructor(options: object) {
    super();
    this.options = options;
  }

  public sendEvent(ev: ValidatedEvent): void {
    console.log(JSON.stringify(ev));
  }

  public sendPresampledEvent(ev: ValidatedEvent): void {
    console.log(JSON.stringify(ev));
  }
}

export class NullTransmission extends Transmission {
  private options: object;

  public constructor(options: object) {
    super();
    this.options = options;
  }

  public sendEvent(_ev: ValidatedEvent): void {}

  public sendPresampledEvent(_ev: ValidatedEvent): void {}
}

export interface TransmissionOptions {
  disabled?: boolean;
  responseCallback?: (x?: any[]) => void;
  batchSizeTrigger?: number;
  batchTimeTrigger?: number;
  maxConcurrentBatches?: number;
  pendingWorkCapacity?: number;
  userAgentAddition?: string;
  proxy?: any;
}

export class BaseTransmission extends Transmission {
  private _responseCallback: (queue: any[]) => void;
  private _batchSizeTrigger: number;
  private _batchTimeTrigger: number;
  private _maxConcurrentBatches: number;
  private _pendingWorkCapacity: number;
  private _sendTimeoutId: number | NodeJS.Timeout;
  public events: ValidatedEvent[];
  private _batchCount: number;
  private _userAgentAddition: string;
  private _proxy: string;
  public _randomFn: () => number;

  private defaultResponseCallback(_queue: any[]): void {}
  
  public constructor(options: TransmissionOptions) {
    super();
    this._responseCallback = this.defaultResponseCallback;
    this._batchSizeTrigger = 50;
    this._batchTimeTrigger = 100;
    this._maxConcurrentBatches = 10;
    this._pendingWorkCapacity = 1000;
    this._sendTimeoutId = -1;
    this.events = [];
    this._batchCount = 0;

    if (typeof options.responseCallback === "function") {
      this._responseCallback = options.responseCallback;
    }
    if (typeof options.batchSizeTrigger === "number") {
      this._batchSizeTrigger = Math.max(options.batchSizeTrigger, 1);
    }
    if (typeof options.batchTimeTrigger === "number") {
      this._batchTimeTrigger = options.batchTimeTrigger;
    }
    if (typeof options.maxConcurrentBatches === "number") {
      this._maxConcurrentBatches = options.maxConcurrentBatches;
    }
    if (typeof options.pendingWorkCapacity === "number") {
      this._pendingWorkCapacity = options.pendingWorkCapacity;
    }

    this._userAgentAddition = options.userAgentAddition || "";
    this._proxy = options.proxy;

    // Included for testing; to stub out randomness and verify that an event
    // was dropped.
    this._randomFn = Math.random;
  }

  public _droppedCallback(ev: ValidatedEvent, reason: string): void {
    this._responseCallback([
      {
        metadata: ev.metadata,
        error: new Error(reason)
      }
    ]);
  }

  public sendEvent(ev: ValidatedEvent): void {
    // bail early if we aren't sampling this event
    if (!this._shouldSendEvent(ev)) {
      this._droppedCallback(ev, "event dropped due to sampling");
      return;
    }

    this.sendPresampledEvent(ev);
  }

  public sendPresampledEvent(ev: ValidatedEvent): void {
    if (this.events.length >= this._pendingWorkCapacity) {
      this._droppedCallback(ev, "queue overflow");
      return;
    }
    this.events.push(ev);
    if (this.events.length >= this._batchSizeTrigger) {
      this._sendBatch();
    } else {
      this._ensureSendTimeout();
    }
  }

  private _sendBatch(): void {
    if (this._batchCount === this._maxConcurrentBatches) {
      // don't start up another concurrent batch.  the next timeout/sendEvent or batch completion
      // will cause us to send another
      return;
    }

    const eachPromise = (batches: Batch[], batchAgg: BatchEndpointAggregator, iteratorFn: (batch: Batch, batchAgg: BatchEndpointAggregator) => Promise<any>): Promise<any> =>
    {
      return batches.reduce((p, batch) => {
        return p.then(() => {
          return iteratorFn(batch, batchAgg);
        });
      }, Promise.resolve());
    };

    const dispatchBatchToHoneycomb = (batch: Batch, batchAgg: BatchEndpointAggregator): Promise<any> => {
      let url = urljoin(batch.apiHost, "/1/batch", batch.dataset);
      let req = superagent.post(url);
      if (this._proxy) {
        req = proxy(req, this._proxy);
      }

      let { encoded, numEncoded } = batchAgg.encodeBatchEvents(batch.events);
      return new Promise(resolve => {
        // if we failed to encode any of the events, no point in sending anything to honeycomb
        if (numEncoded === 0) {
          this._responseCallback(
            batch.events.map(ev => ({
              metadata: ev.metadata,
              error: ev.encodeError
            }))
          );
          resolve();
          return;
        }

        let userAgent = USER_AGENT;
        let trimmedAddition = this._userAgentAddition.trim();
        if (trimmedAddition) {
          userAgent = `${USER_AGENT} ${trimmedAddition}`;
        }

        const start = Date.now();
        req
          .set("X-Hny-Team", batch.writeKey)
          .set("User-Agent", userAgent)
          .type("json")
          .send(encoded)
          .end((err: ResponseError, res: Response) => {
            const end = Date.now();

            if (err) {
              this._responseCallback(
                batch.events.map(ev => ({
                  // eslint-disable-next-line camelcase,  @typescript-eslint/camelcase
                  status_code: ev.encodeError ? undefined : err.status,
                  duration: end - start,
                  metadata: ev.metadata,
                  error: ev.encodeError || err
                }))
              );
            } else {
              const response = JSON.parse(res.text);
              let respIdx = 0;
              this._responseCallback(
                batch.events.map(ev => {
                  if (ev.encodeError) {
                    return {
                      duration: end - start,
                      metadata: ev.metadata,
                      error: ev.encodeError
                    };
                  } else {
                    let nextResponse = response[respIdx++];
                    return {
                      // eslint-disable-next-line camelcase, @typescript-eslint/camelcase
                      status_code: nextResponse.status,
                      duration: end - start,
                      metadata: ev.metadata,
                      error: nextResponse.err
                    };
                  }
                })
              );
            }
            // we resolve unconditionally to continue the iteration in eachSeries.  errors will cause
            // the event to be re-enqueued/dropped.
            resolve();
          });
      });
    };

    const finishBatch = (): void => {
      this._batchCount--;

      const queueLength = this.events.length;
      if (queueLength > 0) {
        if (queueLength >= this._batchSizeTrigger) {
          this._sendBatch();
        } else {
          this._ensureSendTimeout();
        }
      }
    };
    
    this._clearSendTimeout();
    this._batchCount++;
    const batchAgg = new BatchEndpointAggregator(this.events.splice(0, this._batchSizeTrigger));
    const batches = Object.keys(batchAgg.batches).map(k => batchAgg.batches[k]);
    eachPromise(batches, batchAgg, dispatchBatchToHoneycomb)
      .then(finishBatch)
      .catch(finishBatch);
  }

  private _shouldSendEvent(ev: ValidatedEvent): boolean {
    const { sampleRate } = ev;
    if (sampleRate <= 1) {
      return true;
    }
    return this._randomFn() < 1 / sampleRate;
  }

  private _ensureSendTimeout(): void {
    if (this._sendTimeoutId === -1) {
      this._sendTimeoutId = _global.setTimeout(
        () => this._sendBatch(),
        this._batchTimeTrigger
      );
    }
  }

  private _clearSendTimeout(): void {
    if (this._sendTimeoutId !== -1) {
      _global.clearTimeout(this._sendTimeoutId as (number & NodeJS.Timeout));
      this._sendTimeoutId = -1;
    }
  }
}

type transmissionReturnable = (opts: TransmissionOptions) => Transmission;
type transmissionParameter = string | transmissionReturnable;

export function getAndInitTransmission(transmission: transmissionParameter, options: TransmissionOptions): Transmission {
  if (options.disabled) {
    return null;
  }

  if (typeof transmission === "string") {
    switch (transmission) {
      case "base":
        return new BaseTransmission(options);
      case "worker":
        console.warn("worker implementation not ready yet.  using base implementation");
        return new BaseTransmission(options);
      case "mock":
        return new MockTransmission(options);
      case "writer":
        return new WriterTransmission(options);
      case "null":
        return new NullTransmission(options);
      default:
        throw new Error(`unknown transmission implementation "${transmission}".`);
    }
  }

  if (typeof transmission !== "function") {
    throw new Error(
      ".transmission must be one of 'base'/'worker'/'mock'/'writer'/'null' or a constructor."
    );
  }

  try {
    return transmission(options) as Transmission;
  } catch (initialisationError) {
    if (transmission instanceof BaseTransmission) {
      throw new Error("unable to initialize base transmission implementation.");
    }

    console.warn(
      "failed to initialize transmission, falling back to base implementation."
    );
    try {
      return new BaseTransmission(options);
    } catch (fallbackInitialisationError) {
      throw new Error("unable to initialize base transmission implementation.");
    }
  }
}