import ResourceClient from "../resource_client";
import { Dataset } from ".";

const ENDPOINT = "/1/datasets";

export default class Client extends ResourceClient {
  constructor({ apiHost, apiKey, disabled, userAgentAddition }) {
    super(
      apiHost,
      ENDPOINT,
      Dataset,
      apiKey,
      disabled,
      false /* not dataset scoped */,
      userAgentAddition
    );
  }
}
