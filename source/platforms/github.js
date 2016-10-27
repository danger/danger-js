// @flow
"use strict"

import type { GitDSL } from "../dsl/git"
import type { CISource } from "../ci_source/ci_source"
import parseDiff from "parse-diff"

import fetch from "node-fetch"
import "babel-polyfill"

// This pattern of re-typing specific strings has worked well for Artsy in Swift
// so, I'm willing to give it a shot here.

export type APIToken = string;
export type GraphQLQuery = string;
export type GraphQLResponse = any;

/** This represent the GitHub API, and conforming to the Platform Interface */

export class GitHub {
  token: APIToken
  ciSource: CISource
  name: string

  constructor(token: APIToken, ciSource: CISource) {
    this.token = token
    this.ciSource = ciSource
    this.name = "GitHub"
  }

  /**
   * Get the Code Review description metadata
   *
   * @returns {Promise<any>} JSON representation
   */
  async getReviewInfo() : Promise<any> {
    const deets = await this.getPullRequestInfo()
    return await deets.json()
  }

  /**
   * Get the Code Review diff representation
   *
   * @returns {Promise<GitDSL>} the git DSL
   */
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

  /**
   * Returns the response for the new comment
   *
   * @param {string} comment you want to post
   * @returns {Promise<any>} JSON response of new comment
   */
  async createComment(comment: string): Promise<any> {
    console.log("OK?")
    const response = await this.postPRComment(comment)
    console.log(response)
    const json = await response.json()
    console.log(json)
    return response
  }

  /**
   * Gets the list of comments on a PR
   *
   * @returns {Promise<Comment[]>} comments
   */
  // async getComments(): Promise<Comment[]> {
  //   // this.getPRComments(comment)
  // }
  // The above is the API for Platform

  async getUserID(): Promise<number> {
    const info = await this.getUserInfo()
    return info.id
  }

  postPRComment(comment: string): Promise<Response> {
    const repo = this.ciSource.repoSlug
    const prID = this.ciSource.pullRequestID
    return this.post(`repos/${repo}/issues/${prID}/comments`, {}, {
      body: comment
    })
  }

  getPullRequestInfo(): Promise<Response> {
    const repo = this.ciSource.repoSlug
    const prID = this.ciSource.pullRequestID
    return this.get(`repos/${repo}/pulls/${prID}`)
  }

  async getUserInfo(): Promise<any> {
    const response:Response = await this.get("user")
    return await response.json()
  }

  // TODO: This does not handle pagination
  getPullRequestComments(): Promise<Response> {
    const repo = this.ciSource.repoSlug
    const prID = this.ciSource.pullRequestID
    return this.get(`repos/${repo}/pulls/${prID}/comments`)
  }

  getPRComments(): Promise<Response> {
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

  post(path: string, headers: any = {}, body: any = {}, method: string = "POST"): Promise<Response> {
    console.log("posting: ")
    console.log(JSON.stringify(body))

    var myHeaders = new fetch.Headers()
    myHeaders.append('Content-Type', 'application/json')
    myHeaders.append('Authorization', `token ${this.token}`)
    myHeaders.append('Accept', 'application/json')

    return fetch(`https://api.github.com/${path}`, {
      method: method,
      body: JSON.stringify(body),
      headers: myHeaders
    })
  }

  get(path: string, headers: any = {}, body: any = {}, method: string = "GET"): Promise<Response> {
    return fetch(`https://api.github.com/${path}`, {
      method: method,
      body: body,
      headers: { "Authorization": `token ${this.token}`, ...headers }
    })
  }
}
