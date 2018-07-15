/* global describe, it, expect */
import superagent from "superagent";
import mocker from "superagent-mocker";
let mockAgent = mocker(superagent);

import { boardQuery, board } from ".";
import BoardClient from "./client";
import { query, calculation } from "../queries";

describe("boards client", () => {
  it("does a get to the right url for list()", done => {
    mockAgent.get("http://localhost:9999/1/boards/", () => ({
      body: []
    }));

    let client = new BoardClient({
      apiHost: "http://localhost:9999",
      apiKey: "api-key-goes-here"
    });

    client.list().then(boardList => {
      expect(boardList).toEqual([]);
      done();
    });
  });

  it("does a get to the right url for get(id)", done => {
    mockAgent.get("http://localhost:9999/1/boards/abc123", () => ({
      body: {
        id: "abc123",
        name: "board name"
      }
    }));

    let client = new BoardClient({
      apiHost: "http://localhost:9999",
      apiKey: "api-key-goes-here"
    });

    client.get("abc123").then(b => {
      expect(b).toEqual({
        id: "abc123",
        name: "board name",
        queries: []
      });
      done();
    });
  });

  it("does a get to the right url for create(id)", done => {
    mockAgent.post("http://localhost:9999/1/boards", req => {
      let body = Object.assign({}, req.body, { id: "abc123" });
      return { body };
    });

    let client = new BoardClient({
      apiHost: "http://localhost:9999",
      apiKey: "api-key-goes-here"
    });

    let boardToCreate = board({
      name: "valid board name",
      description: "valid board description",
      queries: [
        boardQuery({
          name: "valid board query name",
          description: "valid board query description",
          dataset: "My Dataset",
          query: query({
            calculations: [calculation.COUNT()]
          })
        })
      ]
    });

    client.create(boardToCreate).then(board => {
      expect(board).toEqual(Object.assign(boardToCreate, { id: "abc123" }));
      done();
    });
  });

  it("errors when supplying a dataset", () => {
    let client = new BoardClient({
      apiHost: "http://localhost:9999",
      apiKey: "api-key-goes-here"
    });

    let boardToCreate = board({
      name: "valid board name",
      description: "valid board description",
      queries: [
        boardQuery({
          name: "valid board query name",
          description: "valid board query description",
          dataset: "My Dataset",
          query: query({
            calculations: [calculation.COUNT()]
          })
        })
      ]
    });

    expect(() => client.create(boardToCreate, "datasetName")).toThrow();
    expect(() => client.update(boardToCreate, "datasetName")).toThrow();
    expect(() => client.get("abc123", "datasetName")).toThrow();
    expect(() => client.delete("abc123", "datasetName")).toThrow();
    expect(() => client.list("datasetName")).toThrow();
  });
});
