import ResourceClient from "../resource_client";
import { Column } from ".";

const ENDPOINT = "/1/columns";

export default class Client extends ResourceClient {
  constructor({ apiHost, apiKey, disabled, userAgentAddition }) {
    super(
      apiHost,
      ENDPOINT,
      Column,
      apiKey,
      disabled,
      true /* dataset scoped */,
      userAgentAddition
    );
  }
}
