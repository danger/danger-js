// @flow
"use strict"

import type { GitDSL } from "../danger"
import type { CISource } from "../ci_source/ci_source"
import parseDiff from "parse-diff"

// import type { Metadata, Comment, Platform } from "./platform"
import fetch from "node-fetch"
import "babel-polyfill"

export type APIToken = string;
export type GraphQLQuery = string;
export type GraphQLResponse = any;

/** This represent the GitHub API, and conforming to the Platform Interface */

export class GitHub {
  token: APIToken
  ciSource: CISource

  constructor(token: APIToken, ciSource: CISource) {
    this.token = token
    this.ciSource = ciSource
  }

  name: "GitHub"

  async getReviewInfo() : Promise<any> {
    const deets = await this.getPullRequestInfo()
    return await deets.json()
  }

  async getReviewDiff() : Promise<GitDSL> {
    const diffReq = await this.getPullRequestDiff()
    const diff = await diffReq.text()

    // Worth trying to add a flow-typed for this as a tester?
    const fileDiffs: [any] = parseDiff(diff)

    const addedDiffs = fileDiffs.filter((diff: any) => diff["new"])
    const removedDiffs = fileDiffs.filter((diff: any) => diff["deleted"])
    const modifiedDiffs = fileDiffs.filter((diff: any) => !addedDiffs.includes(diff) && !removedDiffs.includes(diff))

    return {
      modified_files: modifiedDiffs.map((d: any) => d.to),
      created_files: addedDiffs.map((d: any) => d.to),
      deleted_files: removedDiffs.map((d: any) => d.from)
    }
  }

  // The above is the API for Platform

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
