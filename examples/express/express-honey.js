var libhoney = require('libhoney').default;

module.exports = function(options) {
  var honey = new libhoney(options);

  return function(req, res, next) {
    const responseCallback = (queue) => {
      var responses = queue.splice(0, queue.length);
      for (var i = 0; i < responses.length; i ++) {
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
