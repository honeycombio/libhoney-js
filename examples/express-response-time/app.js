/* eslint-env node */
var express = require("express");
var libhoney = require("libhoney").default;
var responseTime = require("response-time");
var app = express();

var honey = new libhoney({
  apiKey: process.env["HONEY_API_KEY"],
  dataset: "express-example-response-time"
});

app.use(
  responseTime(function(req, res, time) {
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
      xhr: req.xhr,
      responseTime_ms: time
    });
  })
);

app.get("/", function(req, res) {
  res.send("Hello World!");
});

app.listen(3000, function() {
  console.log("Example app listening on port 3000!");
});
