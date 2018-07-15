import ResourceClient from "../resource_client";
import { Marker } from ".";

const ENDPOINT = "/1/markers";

export default class Client extends ResourceClient {
  constructor({ apiHost, apiKey, disabled, userAgentAddition }) {
    super(
      apiHost,
      ENDPOINT,
      Marker,
      apiKey,
      disabled,
      true /* dataset scoped */,
      userAgentAddition
    );
  }
}
