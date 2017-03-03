/* global require, describe, it */
import assert from 'assert';
import Transmission from '../lib/transmission';

let superagent = require('superagent');
let mock = require('superagent-mocker')(superagent);

describe('transmission', function() {

  it('should handle apiHosts with trailing slashes', function(done) {
    let endpointHit = false;
    mock.post('http://localhost:9999/1/events/test-transmission', function(req) {
      endpointHit = true;
      return {};
    });

    var transmission = new Transmission({
      batchTimeTrigger: 0,
      responseCallback: function(resp) {
        assert.equal(true, endpointHit);
        done();
      }
    });

    transmission.sendEvent({
      apiHost: "http://localhost:9999/",
      writeKey: "123456789",
      dataset: "test-transmission",
      sampleRate: 1,
      timestamp: new Date(),
      postData: JSON.stringify({ a: 1, b: 2 })
    });
  });
     
  it('should eventually send a single event (after the timeout)', function(done) {
    var transmission = new Transmission({
      batchTimeTrigger: 10,
      responseCallback: function(resp) {
        done();
      }
    });

    transmission.sendEvent({
      apiHost: "http://localhost:9999",
      writeKey: "123456789",
      dataset: "test-transmission",
      sampleRate: 1,
      timestamp: new Date(),
      postData: JSON.stringify({ a: 1, b: 2 })
    });
  });

  it('should respect sample rate and accept the event', function(done) {
    var transmission = new Transmission({
      batchTimeTrigger: 10,
      responseCallback: function(resp) {
        done();
      }
    });

    transmission._randomFn = function() { return 0.09; };
    transmission.sendEvent({
      apiHost: "http://localhost:9999",
      writeKey: "123456789",
      dataset: "test-transmission",
      sampleRate: 10,
      timestamp: new Date(),
      postData: JSON.stringify({ a: 1, b: 2 })
    });
  });

  it('should respect sample rate and drop the event', function(done) {
    var transmission = new Transmission({
      batchTimeTrigger: 10
    });

    transmission._randomFn = function() { return 0.11; };
    transmission._droppedCallback = function() {
      done();
    };

    transmission.sendEvent({
      apiHost: "http://localhost:9999",
      writeKey: "123456789",
      dataset: "test-transmission",
      sampleRate: 10,
      timestamp: new Date(),
      postData: JSON.stringify({ a: 1, b: 2 })
    });
  });

  it('should drop events beyond the pendingWorkCapacity', function(done) {
    var eventDropped;
    var droppedExpected = 5;
    var responseCount = 0;
    var responseExpected = 5;

    mock.post('http://localhost:9999/1/events/test-transmission', function(req) {
      return {};
    });

    var transmission = new Transmission({
      batchTimeTrigger: 50,
      pendingWorkCapacity: responseExpected,
      responseCallback () {
        responseCount ++;
        if (responseCount == responseExpected) {
          done();
        }
      }
    });

    transmission._droppedCallback = function() {
      eventDropped = true;
    };

    // send the events we expect responses for
    for (let i = 0; i < responseExpected; i ++) {
      transmission.sendEvent({
        apiHost: "http://localhost:9999",
        writeKey: "123456789",
        dataset: "test-transmission",
        sampleRate: 1,
        timestamp: new Date(),
        postData: JSON.stringify({ a: 1, b: 2 })
      });
    }

    // send the events we expect to drop.  Since JS is single threaded we can verify that
    // droppedCount behaves the way we want
    for (let i = 0; i < droppedExpected; i ++) {
      eventDropped = false;
      transmission.sendEvent({
        apiHost: "http://localhost:9999",
        writeKey: "123456789",
        dataset: "test-transmission",
        sampleRate: 1,
        timestamp: new Date(),
        postData: JSON.stringify({ a: 1, b: 2 })
      });
      assert.equal(true, eventDropped);
    }
  });

  it('should send the right number events even if it requires multiple concurrent batches', function(done) {
    var responseCount = 0;
    var responseExpected = 10;

    mock.post('http://localhost:9999/1/events/test-transmission', function(req) {
      return {};
    });

    var transmission = new Transmission({
      batchTimeTrigger: 50,
      batchSizeTrigger: 5,
      pendingWorkCapacity: responseExpected,
      responseCallback () {
        responseCount ++;
        if (responseCount == responseExpected) {
          done();
        }
      }
    });

    for (let i = 0; i < responseExpected; i ++) {
      transmission.sendEvent({
        apiHost: "http://localhost:9999",
        writeKey: "123456789",
        dataset: "test-transmission",
        sampleRate: 1,
        timestamp: new Date(),
        postData: JSON.stringify({ a: 1, b: 2 })
      });
    }
  });

  it('should send the right number of events even if they all fail', function(done) {
    var responseCount = 0;
    var responseExpected = 10;

    mock.post('http://localhost:9999/1/events/test-transmission', function(req) {
      return {
        status: 404
      };
    });

    var transmission = new Transmission({
      batchTimeTrigger: 50,
      batchSizeTrigger: 5,
      maxConcurrentBatches: 1,
      pendingWorkCapacity: responseExpected,
      responseCallback ({ error, status_code }) {
        assert.equal(404, error.status);
        assert.equal(404, status_code);
        responseCount ++;
        if (responseCount == responseExpected) {
          done();
        }
      }
    });

    for (let i = 0; i < responseExpected; i ++) {
      transmission.sendEvent({
        apiHost: "http://localhost:9999",
        writeKey: "123456789",
        dataset: "test-transmission",
        sampleRate: 1,
        timestamp: new Date(),
        postData: JSON.stringify({ a: 1, b: 2 })
      });
    }
  });

  it('should send the right number of events even it requires more batches than maxConcurrentBatch', function(done) {
    var responseCount = 0;
    var responseExpected = 50;
    var batchSize = 2;
    mock.post('http://localhost:9999/1/events/test-transmission', function(req) {
      return {};
    });

    var transmission = new Transmission({
      batchTimeTrigger: 50,
      batchSizeTrigger: batchSize,
      pendingWorkCapacity: responseExpected,
      responseCallback () {
        responseCount ++;
        if (responseCount == responseExpected) {
          done();
        }
      }
    });

    for (let i = 0; i < responseExpected; i ++) {
      transmission.sendEvent({
        apiHost: "http://localhost:9999",
        writeKey: "123456789",
        dataset: "test-transmission",
        sampleRate: 1,
        timestamp: new Date(),
        postData: JSON.stringify({ a: 1, b: 2 })
      });
    }
  });
});
