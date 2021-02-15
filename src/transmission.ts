// Copyright 2016 Hound Technology, Inc. All rights reserved.
// Use of this source code is governed by the Apache License 2.0
// license that can be found in the LICENSE file.

/* global global, process */

/**
 * @module
 */
import superagent, { ResponseError, SuperAgentRequest } from "superagent";
import urljoin from "urljoin";

const USER_AGENT = "libhoney-js/<@LIBHONEY_JS_VERSION@>";

const _global =
  typeof window !== "undefined"
    ? window
    : typeof global !== "undefined"
    ? global
    : undefined;

// how many events to collect in a batch
const batchSizeTrigger = 50; // either when the eventQueue is > this length
const batchTimeTrigger = 100; // or it's been more than this many ms since the first push

// how many batches to maintain in parallel
const maxConcurrentBatches = 10;

// how many events to queue up for busy batches before we start dropping
const pendingWorkCapacity = 10000;

// how long (in ms) to give a single POST before we timeout
const deadlineTimeoutMs = 60000;

const emptyResponseCallback = function(
  _transmissionStatus: TransmissionStatus | TransmissionStatus[]
  // eslint-disable-next-line @typescript-eslint/no-empty-function
): void {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function partition<Item, Key extends keyof any, Entry>(
  arr: Item[],
  keyfn: (item: Item) => Key,
  createfn: (item: Item) => Entry,
  addfn: (entry: Entry, item: Item) => void
): Record<Key, Entry> {
  const result = Object.create(null);
  arr.forEach(v => {
    const key = keyfn(v);
    if (!result[key]) {
      result[key] = createfn(v);
    } else {
      addfn(result[key], v);
    }
  });
  return result;
}

class BatchEndpointAggregator {
  batches: Record<
    string,
    {
      apiHost: string;
      writeKey: string;
      dataset: string;
      events: ValidatedEvent[];
    }
  >;
  constructor(events: ValidatedEvent[]) {
    this.batches = partition(
      events,
      /* keyfn */
      ev => `${ev.apiHost}_${ev.writeKey}_${ev.dataset}`,
      /* createfn */
      ev => ({
        apiHost: ev.apiHost,
        writeKey: ev.writeKey,
        dataset: ev.dataset,
        events: [ev]
      }),
      /* addfn */
      (batch, ev) => batch.events.push(ev)
    );
  }

  encodeBatchEvents(events: ValidatedEvent[]) {
    let first = true;
    let numEncoded = 0;
    const encodedEvents = events.reduce((acc, ev) => {
      try {
        const encodedEvent = JSON.stringify(ev);
        numEncoded++;
        const newAcc = acc + (!first ? "," : "") + encodedEvent;
        first = false;
        return newAcc;
      } catch (e) {
        ev.encodeError = e;
        return acc;
      }
    }, "");

    const encoded = "[" + encodedEvents + "]";
    return { encoded, numEncoded };
  }
}

export interface ValidatedEventData {
  timestamp: Date;
  apiHost: string;
  postData: Record<string, unknown>;
  writeKey: string;
  dataset: string;
  sampleRate: number;
  metadata?: unknown;
}

/**
 * @private
 */
export class ValidatedEvent implements ValidatedEventData {
  timestamp: Date;
  apiHost: string;
  postData: Record<string, unknown>;
  writeKey: string;
  dataset: string;
  sampleRate: number;
  metadata?: unknown;
  /**
   * captures error information during preparation for transmission.
   * @private
   */
  encodeError?: Error = null;
  constructor({
    timestamp,
    apiHost,
    postData,
    writeKey,
    dataset,
    sampleRate,
    metadata = undefined
  }: ValidatedEventData) {
    this.timestamp = timestamp;
    this.apiHost = apiHost;
    this.postData = postData;
    this.writeKey = writeKey;
    this.dataset = dataset;
    this.sampleRate = sampleRate;
    this.metadata = metadata;
  }

  toJSON(): unknown {
    const json: Record<string, unknown> = {};
    if (this.timestamp) {
      json.time = this.timestamp;
    }
    if (this.sampleRate) {
      json.samplerate = this.sampleRate;
    }
    if (this.postData) {
      json.data = this.postData;
    }
    return json;
  }

  /** @deprecated Used by the deprecated WriterTransmission. Use ConsoleTransmission instead. */
  toBrokenJSON(): string {
    const fields = [];
    if (this.timestamp) {
      fields.push(`"time":${JSON.stringify(this.timestamp)}`);
    }
    if (this.sampleRate) {
      fields.push(`"samplerate":${JSON.stringify(this.sampleRate)}`);
    }
    if (this.postData) {
      fields.push(`"data":${JSON.stringify(this.postData)}`);
    }
    return `{${fields.join(",")}}`;
  }
}

/** Choose one of the builtin Transmission implementations */
export type TransmissionBuiltin =
  | "base"
  | "worker"
  | "mock"
  | "writer"
  | "console"
  | "null";

/** provide a constructor that will receive the LibhoneyOptions passed into the libhoney constructor */
export type TransmissionConstructor = {
  new (_options: Record<string, unknown>): TransmissionInterface;
};

/** all options to select a transmission implementation */
export type TransmissionImplementation =
  | TransmissionBuiltin
  | TransmissionConstructor;

export interface TransmissionInterface {
  sendEvent(_ev: ValidatedEvent): void;
  sendPresampledEvent(_ev: ValidatedEvent): void;
  flush(): Promise<void>;
}

export class MockTransmission implements TransmissionInterface {
  constructorArg: Record<string, unknown>;
  events: ValidatedEvent[];
  constructor(options: Record<string, unknown>) {
    this.constructorArg = options;
    this.events = [];
  }

  sendEvent(ev: ValidatedEvent): void {
    this.events.push(ev);
  }

  sendPresampledEvent(ev: ValidatedEvent): void {
    this.events.push(ev);
  }

  reset(): void {
    this.constructorArg = null;
    this.events = [];
  }

  flush(): Promise<void> {
    return Promise.resolve();
  }
}

/** @deprecated Use ConsoleTransmission instead. */
export class WriterTransmission implements TransmissionInterface {
  sendEvent(ev: ValidatedEvent): void {
    console.log(JSON.stringify(ev.toBrokenJSON()));
  }

  sendPresampledEvent(ev: ValidatedEvent): void {
    console.log(JSON.stringify(ev.toBrokenJSON()));
  }

  flush(): Promise<void> {
    return Promise.resolve();
  }
}

export class ConsoleTransmission implements TransmissionInterface {
  sendEvent(ev: ValidatedEvent): void {
    console.log(JSON.stringify(ev));
  }

  sendPresampledEvent(ev: ValidatedEvent): void {
    console.log(JSON.stringify(ev));
  }

  flush(): Promise<void> {
    return Promise.resolve();
  }
}

export class NullTransmission implements TransmissionInterface {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  sendEvent(_ev: ValidatedEvent): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  sendPresampledEvent(_ev: ValidatedEvent): void {}

  flush(): Promise<void> {
    return Promise.resolve();
  }
}

export interface TransmissionOptions {
  /** The proxy to send events through. */
  proxy?: string;
  /** We send a batch to the API when this many outstanding events exist in our event queue. */
  batchSizeTrigger?: number;
  /** We send a batch to the API after this many milliseconds have passed. */
  batchTimeTrigger?: number;
  /** callback with transmission status for failed events */
  responseCallback?: TransmissionStatusCallback;
  /** The maximum number of pending events we allow to accumulate in our sending queue before dropping them. */
  pendingWorkCapacity?: number;
  /** We process batches concurrently to increase parallelism while sending. */
  maxConcurrentBatches?: number;
  /** A short identifier to add to the user-agent header. */
  userAgentAddition?: string;
  /** How long (in ms) to give a single POST before we timeout. */
  timeout?: number;
}

export interface TransmissionStatus {
  // eslint-disable-next-line camelcase
  status_code?: unknown;
  duration?: number;
  metadata: unknown;
  error: (Error | ResponseError) & { status?: number; timeout?: boolean };
}

export type TransmissionStatusCallback = (
  transmissionStatus: TransmissionStatus[]
) => void;

/**
 * @private
 */
export class Transmission implements TransmissionInterface {
  _responseCallback: TransmissionStatusCallback;
  _batchSizeTrigger: number;
  _batchTimeTrigger: number;
  _maxConcurrentBatches: number;
  _pendingWorkCapacity: number;
  _timeout: number;
  // hide runtime implementation details
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _sendTimeoutId: any;
  _eventQueue: ValidatedEvent[];
  _batchCount: number;
  _userAgentAddition: string;
  _proxy: string;
  _randomFn: () => number;
  flushCallback: () => void;
  constructor(options: TransmissionOptions) {
    this._responseCallback = emptyResponseCallback;
    this._batchSizeTrigger = batchSizeTrigger;
    this._batchTimeTrigger = batchTimeTrigger;
    this._maxConcurrentBatches = maxConcurrentBatches;
    this._pendingWorkCapacity = pendingWorkCapacity;
    this._timeout = deadlineTimeoutMs;
    this._sendTimeoutId = -1;
    this._eventQueue = [];
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
    if (typeof options.timeout === "number") {
      this._timeout = options.timeout;
    }

    this._userAgentAddition = (options.userAgentAddition || "").trim();
    this._proxy = options.proxy;

    // Included for testing; to stub out randomness and verify that an event
    // was dropped.
    this._randomFn = Math.random;
  }

  _droppedCallback(ev: ValidatedEvent, reason?: string): void {
    this._responseCallback([
      {
        metadata: ev.metadata,
        error: new Error(reason)
      }
    ]);
  }

  sendEvent(ev: ValidatedEvent): Promise<void> {
    // bail early if we aren't sampling this event
    if (!this._shouldSendEvent(ev)) {
      this._droppedCallback(ev, "event dropped due to sampling");
      return;
    }

    return this.sendPresampledEvent(ev);
  }

  sendPresampledEvent(ev: ValidatedEvent): Promise<void> {
    if (this._eventQueue.length >= this._pendingWorkCapacity) {
      this._droppedCallback(ev, "queue overflow");
      return;
    }
    this._eventQueue.push(ev);
    if (this._eventQueue.length >= this._batchSizeTrigger) {
      return this._sendBatch();
    } else {
      this._ensureSendTimeout();
    }
  }

  flush(): Promise<void> {
    if (this._eventQueue.length === 0 && this._batchCount === 0) {
      // we're not currently waiting on anything, we're done!
      return Promise.resolve();
    }

    return new Promise<void>(resolve => {
      this.flushCallback = () => {
        this.flushCallback = null;
        resolve();
      };
    });
  }

  async _sendBatch(): Promise<void> {
    if (this._batchCount === maxConcurrentBatches) {
      // don't start up another concurrent batch.  the next timeout/sendEvent or batch completion
      // will cause us to send another
      return;
    }

    this._clearSendTimeout();

    this._batchCount++;

    const batchAgg = new BatchEndpointAggregator(
      this._eventQueue.splice(0, this._batchSizeTrigger)
    );

    try {
      const batches = Object.keys(batchAgg.batches).map(
        k => batchAgg.batches[k]
      );
      const batchResults = batches.map(async batch => {
        const url = urljoin(batch.apiHost, "/1/batch", batch.dataset);

        const { encoded, numEncoded } = batchAgg.encodeBatchEvents(
          batch.events
        );
        // if we failed to encode any of the events, no point in sending anything to honeycomb
        if (numEncoded === 0) {
          this._responseCallback(
            batch.events.map(ev => ({
              metadata: ev.metadata,
              error: ev.encodeError
            }))
          );
          return;
        }

        const postReq = superagent.post(url);
        let req: SuperAgentRequest;
        if (process.env.LIBHONEY_TARGET === "browser") {
          req = postReq;
        } else if (!this._proxy) {
          req = postReq;
        } else {
          // dynamically load superagent-proxy, as it takes its sorry time to load and is rarely used/
          // NOTE: superagent-proxy's @types are not helpful for these loading shenanigans and thus have not been added.
          const foo = await import("superagent-proxy");
          const setupFn = foo.default;
          req = setupFn(postReq, this._proxy) as SuperAgentRequest;
        }

        let userAgent = USER_AGENT;
        if (this._userAgentAddition) {
          userAgent = `${USER_AGENT} ${this._userAgentAddition}`;
        }

        const start = Date.now();

        try {
          const res = await req
            .set("X-Honeycomb-Team", batch.writeKey)
            .set(
              process.env.LIBHONEY_TARGET === "browser"
                ? "X-Honeycomb-UserAgent"
                : "User-Agent",
              userAgent
            )
            .type("json")
            .timeout(this._timeout)
            .send(encoded);

          const end = Date.now();

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
                const nextResponse = response[respIdx++];
                return {
                  // eslint-disable-next-line camelcase
                  status_code: nextResponse.status,
                  duration: end - start,
                  metadata: ev.metadata,
                  error: nextResponse.err
                };
              }
            })
          );
        } catch (err) {
          const end = Date.now();

          this._responseCallback(
            batch.events.map(ev => ({
              // eslint-disable-next-line camelcase
              status_code: ev.encodeError ? undefined : err.status,
              duration: end - start,
              metadata: ev.metadata,
              error: ev.encodeError || err
            }))
          );
        }
      });
      await Promise.all(batchResults);
    } finally {
      this._batchCount--;

      const queueLength = this._eventQueue.length;
      if (queueLength > 0) {
        if (queueLength >= this._batchSizeTrigger) {
          // there's still events in the queue, continue sending
          await this._sendBatch();
        } else {
          this._ensureSendTimeout();
        }
      } else if (this._batchCount === 0 && this.flushCallback) {
        this.flushCallback();
      }
    }
  }

  _shouldSendEvent(ev: ValidatedEvent): boolean {
    const { sampleRate } = ev;
    if (sampleRate <= 1) {
      return true;
    }
    return this._randomFn() < 1 / sampleRate;
  }

  _ensureSendTimeout(): void {
    if (this._sendTimeoutId === -1) {
      this._sendTimeoutId = _global.setTimeout(
        () => this._sendBatch(),
        this._batchTimeTrigger
      );
    }
  }

  _clearSendTimeout(): void {
    if (this._sendTimeoutId !== -1) {
      _global.clearTimeout(this._sendTimeoutId);
      this._sendTimeoutId = -1;
    }
  }
}
