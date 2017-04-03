/* global describe, it, require, beforeEach */
import assert from 'assert';
import libhoney from '../lib/libhoney';

import { _transmissionConstructorArg, _transmissionSendEventArg, MockTransmission, resetArgs } from './mock_transmission';

let superagent = require('superagent');
let mock = require('superagent-mocker')(superagent);

describe('libhoney', function() {
  describe("constructor options", function() {
    beforeEach(resetArgs);
    it("should be communicated to transmission constructor", function() {
      var options = { a: 1, b: 2, c: 3, d: 4, transmission: MockTransmission };

      new libhoney(options);

      assert.equal(options.a, _transmissionConstructorArg.a);
      assert.equal(options.b, _transmissionConstructorArg.b);
      assert.equal(options.c, _transmissionConstructorArg.c);
      assert.equal(options.d, _transmissionConstructorArg.d);
    });
  });

  describe("event properties", function() {
    beforeEach(resetArgs);
    it("should ultimately fallback to hardcoded defaults", function() {
      var honey = new libhoney({
        // these two properties are required
        writeKey: "12345",
        dataset: "testing",
        transmission: MockTransmission
      });
      var postData = { a : 1, b : 2};
      honey.sendNow(postData);

      assert.equal(_transmissionSendEventArg.apiHost, "https://api.honeycomb.io/");
      assert.equal(_transmissionSendEventArg.writeKey, "12345");

      assert.equal(_transmissionSendEventArg.dataset, "testing");
      assert.equal(_transmissionSendEventArg.sampleRate, 1);
      assert(_transmissionSendEventArg.timestamp instanceof Date);
      assert.equal(_transmissionSendEventArg.postData, JSON.stringify(postData));
    });

    it("should come from libhoney options if not specified in event", function() {
      var honey = new libhoney({
        apiHost: "http://foo/bar",
        writeKey: "12345",
        dataset: "testing",
        transmission: MockTransmission
      });
      var postData = { a : 1, b : 2};
      honey.sendNow(postData);

      assert.equal(_transmissionSendEventArg.apiHost, "http://foo/bar");
      assert.equal(_transmissionSendEventArg.writeKey, "12345");
      assert.equal(_transmissionSendEventArg.dataset, "testing");
      assert.equal(_transmissionSendEventArg.postData, JSON.stringify(postData));
    });
  });

  describe("response queue", function() {
    beforeEach(resetArgs);
    it("should enqueue a maximum of maxResponseQueueSize, dropping new responses (not old)", function(done) {
      mock.post('http://localhost:9999/1/events/testResponseQueue', function(req) {
        return {};
      });

      var queueSize = 50;
      var queueFullCount = 0;
      var honey = new libhoney({
        apiHost: "http://localhost:9999",
        writeKey: "12345",
        dataset: "testResponseQueue",
        maxResponseQueueSize: queueSize
      });

      // we send queueSize+1 events, so we should see two response events with queueSize as the length
      honey.on("response", (queue) => {
        if (queue.length !== queueSize) {
          return;
        }

        queueFullCount ++;
        if (queueFullCount === 2) {
          queue.sort((a,b) => a.metadata - b.metadata);
          assert.equal(queue[0].metadata, 0);
          assert.equal(queue[queueSize-1].metadata, queueSize-1);
          done();
        }
      });

      for (var i = 0; i < queueSize + 1; i ++) {
        var ev = honey.newEvent();
        ev.add({ a : 1, b : 2});
        ev.addMetadata(i);
        ev.send();
      }
    });
  });

  describe("disabled = true", function() {
    beforeEach(resetArgs);
    it("should not hit transmission", function() {
      var honey = new libhoney({
        // these two properties are required
        writeKey: "12345",
        dataset: "testing",
        transmission: MockTransmission,
        disabled: true
      });

      var postData = { a : 1, b : 2};
      honey.sendNow(postData);
      assert.equal(_transmissionSendEventArg, null);

      var ev = honey.newEvent();
      honey.sendEvent(ev);
      assert.equal(_transmissionSendEventArg, null);

      honey.sendPresampledEvent(ev);
      assert.equal(_transmissionSendEventArg, null);
    });
  });
});
