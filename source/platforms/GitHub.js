// @flow
"use strict"

import type { GitDSL } from "../dsl/GitDSL"
import type { CISource } from "../ci_source/ci_source"
import parseDiff from "parse-diff"

import fetch from "node-fetch"
import "babel-polyfill"

import os from "os"

// This pattern of re-typing specific strings has worked well for Artsy in Swift
// so, I'm willing to give it a shot here.

export type APIToken = string;

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
  async getReviewInfo(): Promise<any> {
    const deets = await this.getPullRequestInfo()
    return await deets.json()
  }

  /**
   * Get the Code Review diff representation
   *
   * @returns {Promise<GitDSL>} the git DSL
   */
  async getReviewDiff(): Promise<GitDSL> {
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
      deleted_files: removedDiffs.map((d: any) => d.from),
      diffForFile: (name: string) => {
        const diff = fileDiffs.find((diff) => diff.from === name || diff.to === name)
        if (!diff) { return null }

        const changes = diff.chunks.map((c) => { return c.changes })
                            .reduce((a, b) => a.concat(b), [])
        const lines = changes.map((c) => { return c.content })
        return lines.join(os.EOL)
      }
    }
  }

  /**
   * Returns the response for the new comment
   *
   * @param {string} comment you want to post
   * @returns {Promise<any>} JSON response of new comment
   */
  async createComment(comment: string): Promise<any> {
    return this.postPRComment(comment)
  }

  // In Danger RB we support a danger_id property,
  // this should be handled at some point

  /**
   * Deletes the main Danger comment, used when you have
   * fixed all your failures.
   *
   * @returns {Promise<bool>} did it work?
   */
  async deleteMainComment(): Promise<bool> {
    const commentID = await this.getDangerCommentID()
    if (commentID) { await this.deleteCommentWithID(commentID) }
    return commentID !== null
  }

  /**
   * Either updates an existing comment, or makes a new one
   *
   * @param {string} newComment string value of comment
   * @returns {Promise<bool>} success of posting comment
   */
  async updateOrCreateComment(newComment: string): Promise<bool> {
    const commentID = await this.getDangerCommentID()
    if (commentID) { await this.updateCommentWithID(commentID, newComment) }
    else { await this.createComment(newComment) }
    return true
  }

  /**
   * Updates the main Danger comment, when Danger has run
   * more than once
   *
   * @param {string} comment updated text
   *
   * @returns {Promise<bool>} did it work?
   */
  async editMainComment(comment: string): Promise<bool> {
    const commentID = await this.getDangerCommentID()
    if (commentID) { await this.updateCommentWithID(commentID, comment) }
    return commentID !== null
  }

  // The above is the API for Platform

  async getDangerCommentID(): Promise<?number> {
    const userID = await this.getUserID()
    const allCommentsResponse = await this.getPullRequestComments()
    const allComments: any[] = await allCommentsResponse.json()
    const dangerComment = allComments.find((comment: any) => comment.user.id === userID)
    return dangerComment ? dangerComment.id : null
  }

  async updateCommentWithID(id: number, comment: string): Promise<Response> {
    const repo = this.ciSource.repoSlug
    return this.patch(`repos/${repo}/issues/comments/${id}`, {}, {
      body: comment
    })
  }

  async deleteCommentWithID(id: number): Promise<Response> {
    const repo = this.ciSource.repoSlug
    return this.get(`repos/${repo}/issues/comments/${id}`, {}, {}, "DELETE")
  }

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
    return this.get(`repos/${repo}/issues/${prID}/comments`)
  }

  getPullRequestDiff(): Promise<Response> {
    const repo = this.ciSource.repoSlug
    const prID = this.ciSource.pullRequestID
    return this.get(`repos/${repo}/pulls/${prID}`, {
      accept: "application/vnd.github.v3.diff"
    })
  }

  // maybe this can move into the stuff below
  post(path: string, headers: any = {}, body: any = {}, method: string = "POST"): Promise<Response> {
    return fetch(`https://api.github.com/${path}`, {
      method: method,
      body: JSON.stringify(body),
      headers: {
        "Authorization": `token ${this.token}`,
        "Content-Type": "application/json",
        ...headers }
    })
  }

  get(path: string, headers: any = {}, body: any = {}, method: string = "GET"): Promise<Response> {
    return fetch(`https://api.github.com/${path}`, {
      method: method,
      body: body,
      headers: {
        "Authorization": `token ${this.token}`,
        "Content-Type": "application/json",
        ...headers }
    })
  }

  patch(path: string, headers: any = {}, body: any = {}, method: string = "PATCH"): Promise<Response> {
    return fetch(`https://api.github.com/${path}`, {
      method: method,
      body: JSON.stringify(body),
      headers: {
        "Authorization": `token ${this.token}`,
        "Content-Type": "application/json",
        ...headers }
    })
  }
}
