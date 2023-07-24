/* eslint-env node */
const libhoney = require("libhoney");

let honey = new libhoney({
  writeKey: process.env["HONEYCOMB_API_KEY"],
  dataset: "express-example"
});

function factorial(n) {
  honey.sendNow({
    factorialNum: n
  });
  if (n < 0) {
    return -1 * factorial(Math.abs(n));
  }
  if (n === 0) {
    return 1;
  }
  return n * factorial(n - 1);
}

console.log("Starting factorial example...");

factorial(10);

console.log("Finished factorial example!");
