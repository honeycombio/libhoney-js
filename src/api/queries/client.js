import ResourceClient from "../resource_client";
import { Query } from ".";

const ENDPOINT = "/1/queries";

export default class Client extends ResourceClient {
  constructor({ apiHost, apiKey, disabled, userAgentAddition }) {
    super(
      apiHost,
      ENDPOINT,
      Query,
      apiKey,
      disabled,
      true /* dataset scoped */,
      userAgentAddition
    );
  }
}
