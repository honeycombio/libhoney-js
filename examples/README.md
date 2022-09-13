To build and run these examples:

1. `npm run build`
1. `cd $example-dir`
1. `npm install ../.. # this installs the libhoney you built above`
1. `npm install`
1. `HONEYCOMB_API_KEY=YOUR_WRITE_KEY npm start`

In a different terminal, you can then `curl --get http://localhost:3000/` to send a request to the running example,
and then see the resulting telemetry at ui.honeycomb.io.
