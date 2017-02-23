/* global describe, it */
import assert from 'assert';
import libhoney from '../lib/libhoney';

import { _transmissionConstructorArg, _transmissionSendEventArg, MockTransmission } from './mock_transmission';

describe('libhoney', function() {
  describe("constructor options", function() {
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
});
