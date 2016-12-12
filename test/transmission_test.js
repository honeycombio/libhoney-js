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

    transmission._randomFn = function() { return 0.09 };
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
});
