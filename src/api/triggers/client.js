import ResourceClient from "../resource_client";
import { Trigger } from ".";

const ENDPOINT = "/1/triggers";

export default class Client extends ResourceClient {
  constructor({ apiHost, apiKey, disabled, userAgentAddition }) {
    super(
      apiHost,
      ENDPOINT,
      Trigger,
      apiKey,
      disabled,
      true /* dataset scoped */,
      userAgentAddition
    );
  }
}
