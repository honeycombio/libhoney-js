export let _transmissionConstructorArg = null;
export let _transmissionSendEventArg = null;

export class MockTransmission {
  constructor(options) {
    _transmissionConstructorArg = options;
  }

  sendEvent (ev) {
    _transmissionSendEventArg = ev;
  }
}
