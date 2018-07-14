import ResourceClient from "../resource_client";
import { Board } from ".";

const ENDPOINT = "/1/boards";

export default class Client extends ResourceClient {
  constructor({ apiHost, apiKey, disabled, userAgentAddition }) {
    super(apiHost, ENDPOINT, Board, apiKey, disabled, userAgentAddition);
  }
}
