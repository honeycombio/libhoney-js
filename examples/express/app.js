/* eslint-env node */
var express = require("express");
var honey = require("./express-honey");
var app = express();

app.use(
  honey({
    apiKey: process.env["HONEY_API_KEY"],
    dataset: "express-example"
  })
);

app.get("/", function(req, res) {
  res.send("Hello World!");
});

app.listen(3000, function() {
  console.log("Example app listening on port 3000!");
});
