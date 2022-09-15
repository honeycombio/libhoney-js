/* eslint-env node */
const express = require("express");
const honey = require("./express-honey");
const app = express();

app.use(
  honey({
    writeKey: process.env["HONEY_WRITE_KEY"],
    dataset: "express-example-dynamic-fields",
    sampleRate: 5 // log 1 out of every 5 events
  })
);

app.get("/", function(req, res) {
  res.send("Hello World!");
});

app.listen(3000, function() {
  console.log("Example app listening on port 3000!");
});
