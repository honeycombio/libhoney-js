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

});
