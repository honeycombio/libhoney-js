import assert from 'assert';
import Transmission from '../lib/transmission';

describe('transmission', function() {

  it('should eventually send a single event (after the timeout)', function(done) {
    var transmission = new Transmission({
      batchTimeTrigger: 10,
      responseCallback: function(resp) {
        done();
      }
    });

    transmission.sendEvent({
      postUrl: "http://localhost:9999",
      writeKey: "123456789",
      dataSet: "test-transmission",
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
      postUrl: "http://localhost:9999",
      writeKey: "123456789",
      dataSet: "test-transmission",
      sampleRate: 10,
      timestamp: new Date(),
      postData: JSON.stringify({ a: 1, b: 2 })
    });
  });

  it('should respect sample rate and drop the event', function(done) {
    var transmission = new Transmission({
      batchTimeTrigger: 10,
    });

    transmission._randomFn = function() { return 0.11 };
    transmission._droppedCallback = function() {
      done();
    };

    transmission.sendEvent({
      postUrl: "http://localhost:9999",
      writeKey: "123456789",
      dataSet: "test-transmission",
      sampleRate: 10,
      timestamp: new Date(),
      postData: JSON.stringify({ a: 1, b: 2 })
    });
  });
});
