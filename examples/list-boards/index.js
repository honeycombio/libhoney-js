/* eslint-env node */
const Libhoney = require("libhoney");
const process = require("process");

const honey = new Libhoney({
  apiHost: process.env.HONEYCOMB_API_HOST,
  apiKey: process.env.HONEYCOMB_API_KEY
});

honey.boards
  .list()
  .then(boards =>
    boards.forEach(b => {
      console.log(`Name: ${b.name}`);
      console.log(b.queries);
    })
  )
  .catch(err => {
    console.error(`got error ${err} :( :( :(`);
  });
