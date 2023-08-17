/* eslint-env node */
const express = require("express");
const honey = require("./express-honey");
let app = express();

app.use(
  honey({
    writeKey: process.env["HONEYCOMB_API_KEY"],
    // proxy: "http://localhost:3128",
    dataset: "express-example"
  })
);

app.get("/", function(req, res) {
  res.send("Hello World!");
});

app.listen(3000, function() {
  console.log("Example app listening on port 3000!");
});
