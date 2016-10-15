// @flow
"use strict"

// import type { Metadata, Comment, Platform } from "./platform"
import fetch from "node-fetch"

export type APIToken = string;
export type GraphQLQuery = string;
export type GraphQLResponse = any;

export class GitHub {
  token: APIToken
  constructor(token: APIToken) { this.token = token }

  async getInfo() : void {
    console.log("starting")
    let deets = await this.getUserInfo()
    console.log(deets)
  }

  async getUserInfo(): Promise<any> {
    return fetch("https://api.github.com/user", {
      method: "GET",
      body: "",
      headers: { "Authorization": this.token }
    })
  }

  async runQuery(query: GraphQLQuery): Promise<GraphQLResponse> {
    return fetch("https://api.github.com/user", {
      method: "GET",
      body: "",
      headers: { "Authorization": "aacf0f931f363a0670f6e8b70ac82c1cdead94c0" }
    })
  }
}
