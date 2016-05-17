var express = require('express');
var honey = require('./express-honey');
var app = express();

app.use(honey({
  apiHost: process.env["HONEY_API_HOST"],
  writeKey: process.env["HONEY_WRITE_KEY"],
  dataset: process.env["HONEY_DATASET"],
}));

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
