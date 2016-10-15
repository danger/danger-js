// @flow
"use strict"

import type { CISource } from "../ci_source/ci_source"
import parseDiff from "parse-diff"

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

    let diffReq = await this.getPullRequestDiff()
    let diff = await diffReq.text()
    let fileDiffs: [any] = parseDiff(diff)

    let addedDiffs = fileDiffs.filter((diff: any) => diff["new"])
    let removedDiffs = fileDiffs.filter((diff: any) => diff["deleted"])
    let modified = fileDiffs.filter((diff: any) => !addedDiffs.includes(diff) && !removedDiffs.includes(diff))

    console.log("Added: ", addedDiffs)
    console.log("Removed: ", removedDiffs)
    console.log("Modified: ", modified)
  }

  getUserInfo(): Promise<Response> {
    return this.get("user")
  }

  getPullRequestInfo(): Promise<Response> {
    const repo = this.ciSource.repoSlug
    const prID = this.ciSource.pullRequestID
    return this.get(`repos/${repo}/pulls/${prID}`)
  }

  getPullRequestDiff(): Promise<Response> {
    const repo = this.ciSource.repoSlug
    const prID = this.ciSource.pullRequestID
    return this.get(`repos/${repo}/pulls/${prID}`, {
      accept: "application/vnd.github.v3.diff"
    })
  }

  get(path: string, headers: any = {}, body: any = {}): Promise<Response> {
    return fetch(`https://api.github.com/${path}`, {
      method: "GET",
      body: body,
      headers: { "Authorization": `token ${this.token}`, ...headers }
    })
  }
}
