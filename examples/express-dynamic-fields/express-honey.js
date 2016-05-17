var libhoney = require('libhoney').default;
var process = require('process');

module.exports = function(options) {
  var honey = new libhoney(options);

  return function(req, res, next) {
    var builder = honey.newBuilder({
      app: req.app,
      baseUrl: req.baseUrl,
      fresh: req.fresh,
      hostname: req.hostname,
      ip: req.ip,
      method: req.method,
      originalUrl: req.originalUrl,
      params: req.params,
      path: req.path,
      protocol: req.protocol,
      query: req.query,
      route: req.route,
      secure: req.secure,
      xhr: req.xhr,

      // fields here give the values at the time newBuilder is called
      rss_before: process.memoryUsage().rss,
      heapTotal_before: process.memoryUsage().heapTotal,
      heapUsed_before: process.memoryUsage().heapUsed
    }, {
      // dynamic fields generate values at the time the event is created
      // (the buidler.sendNow call below.)
      rss_after: () => process.memoryUsage().rss,
      heapTotal_after: () => process.memoryUsage().heapTotal,
      heapUsed_after: () => process.memoryUsage().heapUsed
    });

    next();

    builder.sendNow();
  };
};
