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
    datasetScoped,
    userAgentAddition = ""
  ) {
    this.apiHost = apiHost;
    this.resourceEndpoint = resourceEndpoint;
    this.resourceType = resourceType;
    this.apiKey = apiKey;
    this.disabled = disabled;
    this.datasetScoped = datasetScoped;

    let userAgent = USER_AGENT;
    let trimmedAddition = userAgentAddition.trim();
    if (trimmedAddition) {
      userAgent = `${USER_AGENT} ${trimmedAddition}`;
    }
    this.userAgent = userAgent;
  }

  newRequest(method, id = "", datasetName) {
    let url;
    if (this.datasetScoped) {
      url = urljoin(this.apiHost, this.resourceEndpoint, datasetName, id);
    } else {
      url = urljoin(this.apiHost, this.resourceEndpoint, id);
    }

    return superagent[method](url)
      .set("X-Hny-Team", this.apiKey)
      .set("User-Agent", this.userAgent)
      .type("json");
  }
  create(resource, datasetName) {
    if (this.datasetScoped && !datasetName) {
      throw new Error(
        `a datasetName is required to create a ${this.resourceType.name}`
      );
    } else if (!this.datasetScoped && datasetName) {
      throw new Error(
        `a datasetName cannot be used to create a ${this.resourceType.name}`
      );
    }

    return new Promise((resolve, reject) => {
      this.newRequest("post", undefined, datasetName)
        .send(resource)
        .end((err, res) => {
          // more here
          if (err) {
            reject(err);
            return;
          }
          resolve(this.resourceType.fromJSON(res.body));
        });
    });
  }
  get(id, datasetName) {
    if (this.datasetScoped && !datasetName) {
      throw new Error(
        `a datasetName is required to fetch a ${this.resourceType.name}`
      );
    } else if (!this.datasetScoped && datasetName) {
      throw new Error(
        `a datasetName cannot be used to fetch a ${this.resourceType.name}`
      );
    }

    return new Promise((resolve, reject) => {
      this.newRequest("get", id, datasetName)
        .send()
        .end((err, res) => {
          // more here
          if (err) {
            reject(err);
            return;
          }
          resolve(this.resourceType.fromJSON(res.body));
        });
    });
  }
  delete(id, datasetName) {
    if (this.datasetScoped && !datasetName) {
      throw new Error(
        `a datasetName is required to delete a ${this.resourceType.name}`
      );
    } else if (!this.datasetScoped && datasetName) {
      throw new Error(
        `a datasetName cannot be used to delete a ${this.resourceType.name}`
      );
    }

    return new Promise((resolve, reject) => {
      this.newRequest("delete", id, datasetName)
        .send()
        .end(err => {
          // more here?
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
    });
  }
  update(resource, datasetName) {
    if (this.datasetScoped && !datasetName) {
      throw new Error(
        `a datasetName is required to update a ${this.resourceType.name}`
      );
    } else if (!this.datasetScoped && datasetName) {
      throw new Error(
        `a datasetName cannot be used to update a ${this.resourceType.name}`
      );
    }
    return new Promise((resolve, reject) => {
      this.newRequest("put", resource.id, datasetName)
        .send(resource)
        .end((err, res) => {
          // more here
          if (err) {
            reject(err);
            return;
          }
          resolve(this.resourceType.fromJSON(res.body));
        });
    });
  }
  list(datasetName) {
    if (this.datasetScoped && !datasetName) {
      throw new Error(
        `a datasetName is required to list ${this.resourceType.name}s`
      );
    } else if (!this.datasetScoped && datasetName) {
      throw new Error(
        `a datasetName cannot be used to list ${this.resourceType.name}s`
      );
    }

    return new Promise((resolve, reject) => {
      this.newRequest("get", undefined, datasetName)
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
