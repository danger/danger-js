// @flow
"use strict"

import type { CISource } from "../ci_source/ci_source"

// import type { Metadata, Comment, Platform } from "./platform"
import fetch from "node-fetch"
import "babel-polyfill"

export type APIToken = string;
export type GraphQLQuery = string;
export type GraphQLResponse = any;

export class GitHub {
  token: APIToken
  ciSource: CISource

  constructor(token: APIToken, ciSource: CISource) {
    this.token = token
    this.ciSource = ciSource
  }

  async getInfo() : void {
    let deets = await this.getPullRequestInfo()
    let pr = await deets.json()
    console.log(pr)
  }

  getUserInfo(): Promise<Response> {
    return this.get("user")
  }

  getPullRequestInfo(): Promise<Response> {
    const repo = this.ciSource.repoSlug
    const prID = this.ciSource.pullRequestID
    return this.get(`repos/${repo}/pulls/${prID}`)
  }

  get(path: string, body: any = {}): Promise<Response> {
    return fetch(`https://api.github.com/${path}`, {
      method: "GET",
      body: body,
      headers: { "Authorization": `token ${this.token}` }
    })
  }
}
