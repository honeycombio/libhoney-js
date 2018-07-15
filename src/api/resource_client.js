import superagent from "superagent";
import urljoin from "urljoin";

const USER_AGENT = "libhoney-js/<@LIBHONEY_JS_VERSION@>";

export default class ResourceClient {
  constructor(
    apiHost,
    resourceEndpoint,
    resourceType,
    apiKey,
    disabled,
    userAgentAddition = ""
  ) {
    this.apiHost = apiHost;
    this.resourceEndpoint = resourceEndpoint;
    this.resourceType = resourceType;
    this.apiKey = apiKey;
    this.disabled = disabled;

    let userAgent = USER_AGENT;
    let trimmedAddition = userAgentAddition.trim();
    if (trimmedAddition) {
      userAgent = `${USER_AGENT} ${trimmedAddition}`;
    }
    this.userAgent = userAgent;
  }

  newRequest(method, id = "") {
    return superagent[method](urljoin(this.apiHost, this.resourceEndpoint, id))
      .set("X-Hny-Team", this.apiKey)
      .set("User-Agent", this.userAgent);
  }
  create(resource) {
    return new Promise((resolve, reject) => {
      this.newRequest("post")
        .type("json")
        .send(resource)
        .end((err, res) => {
          // more here
          if (err) {
            reject(err);
            return;
          }
          resolve(this.resourceType.fromJSON(res));
        });
    });
  }
  get(id) {
    return new Promise((resolve, reject) => {
      this.newRequest("get", id)
        .send()
        .end((err, res) => {
          // more here
          if (err) {
            reject(err);
            return;
          }
          resolve(this.resourceType.fromJSON(res));
        });
    });
  }
  delete(id) {
    return new Promise((resolve, reject) => {
      this.newRequest("delete", id)
        .send()
        .end((err, res) => {
          // more here
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
    });
  }
  update(resource) {
    return new Promise((resolve, reject) => {
      this.newRequest("put", resource.id)
        .type("json")
        .send(resource)
        .end((err, res) => {
          // more here
          if (err) {
            reject(err);
            return;
          }
          resolve(this.resourceType.fromJSON(res));
        });
    });
  }
  list() {
    return new Promise((resolve, reject) => {
      this.newRequest("get")
        .type("json")
        .send()
        .end((err, res) => {
          if (err) {
            reject(err);
            return;
          }
          resolve((res.body || []).map(r => this.resourceType.fromJSON(r)));
        });
    });
  }
}
