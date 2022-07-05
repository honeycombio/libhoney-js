/* eslint-env node */
const libhoney = require("libhoney");

module.exports = function(options) {
  let honey = new libhoney(options);

  return function(req, res, next) {
    const responseCallback = queue => {
      let responses = queue.splice(0, queue.length);
      for (let i = 0; i < responses.length; i++) {
        console.log("response status =", responses[i].status_code);
      }
    };
    honey.once("response", responseCallback);

    honey.sendNow({
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
      xhr: req.xhr
    });
    next();
  };
};