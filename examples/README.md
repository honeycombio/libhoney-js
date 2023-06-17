# Libhoney Examples

You will need a Honeycomb API key to send data with the examples. You can find your API key [here](https://docs.honeycomb.io/working-with-your-data/settings/api-keys/#find-api-keys).

To build and run these examples:

1. `npm install # install dependencies from the repo root`
1. `npm run build # build the libhoney package`
1. `cd $example-dir`
1. `npm install ../.. # this installs the libhoney packge you built above`
1. `npm install # install example dependencies`
1. `HONEYCOMB_API_KEY=YOUR_WRITE_KEY npm start`

In a different terminal, you can then `curl --get http://localhost:3000/` to send a request to the running example,
and then see the resulting telemetry at ui.honeycomb.io.
