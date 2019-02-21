/* eslint-env node */
const libhoney = require("libhoney");
const process = require("process");

module.exports = function(options) {
  let honey = new libhoney(options);

  // Attach dynamic fields to the global event builder in libhoney.
  // Dynamic fields calculate their values at the time the event is created
  // (the event.send() call below)
  honey.addDynamicField("rss_after", () => process.memoryUsage().rss);
  honey.addDynamicField(
    "heapTotal_after",
    () => process.memoryUsage().heapTotal
  );
  honey.addDynamicField("heapUsed_after", () => process.memoryUsage().heapUsed);

  return function(req, res, next) {
    let event = honey.newEvent();
    event.add({
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

      // these fields capture values for memory usage at the time they're added
      // to the newEvent
      rss_before: process.memoryUsage().rss,
      heapTotal_before: process.memoryUsage().heapTotal,
      heapUsed_before: process.memoryUsage().heapUsed
    });

    next();

    event.send();
  };
};
