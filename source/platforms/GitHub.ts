import { GitDSL } from "../dsl/GitDSL"
import { CISource } from "../ci_source/ci_source"
import * as parseDiff from "parse-diff"
import * as includes from "lodash.includes"
import * as find from "lodash.find"

import { api as fetch } from "../api/fetch"
import * as os from "os"

// This pattern of re-typing specific strings has worked well for Artsy in Swift
// so, I'm willing to give it a shot here.

export type APIToken = string

// TODO: Cache PR JSON

/** This represent the GitHub API, and conforming to the Platform Interface */

export class GitHub {
  name: string
  fetch: typeof fetch

  constructor(public readonly token: APIToken, public readonly ciSource: CISource) {
    this.name = "GitHub"

    // This allows Peril to DI in a new Fetch function
    // which can handle unique API edge-cases around integrations
    this.fetch = fetch
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

    const fileDiffs: Array<any> = parseDiff(diff)

    const addedDiffs = fileDiffs.filter((diff: any) => diff["new"])
    const removedDiffs = fileDiffs.filter((diff: any) => diff["deleted"])
    const modifiedDiffs = fileDiffs.filter((diff: any) => !includes(addedDiffs, diff) && !includes(removedDiffs, diff))

    return {
      modified_files: modifiedDiffs.map((d: any) => d.to),
      created_files: addedDiffs.map((d: any) => d.to),
      deleted_files: removedDiffs.map((d: any) => d.from),
      diffForFile: (name: string) => {
        const diff = find(fileDiffs, (diff: any) => diff.from === name || diff.to === name)
        if (!diff) { return null }

        const changes = diff.chunks.map((c: any) => c.changes)
          .reduce((a: any, b: any) => a.concat(b), [])
        const lines = changes.map((c: any) => c.content)
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
   * @returns {Promise<boolean>} did it work?
   */
  async deleteMainComment(): Promise<boolean> {
    const commentID = await this.getDangerCommentID()
    if (commentID) { await this.deleteCommentWithID(commentID) }
    return commentID !== null
  }

  /**
   * Either updates an existing comment, or makes a new one
   *
   * @param {string} newComment string value of comment
   * @returns {Promise<boolean>} success of posting comment
   */
  async updateOrCreateComment(newComment: string): Promise<boolean> {
    const commentID = await this.getDangerCommentID()
    if (commentID) {
      await this.updateCommentWithID(commentID, newComment)
    } else {
      await this.createComment(newComment)
    }
    return true
  }

  /**
   * Updates the main Danger comment, when Danger has run
   * more than once
   *
   * @param {string} comment updated text
   *
   * @returns {Promise<boolean>} did it work?
   */
  async editMainComment(comment: string): Promise<boolean> {
    const commentID = await this.getDangerCommentID()
    if (commentID) { await this.updateCommentWithID(commentID, comment) }
    return commentID !== null
  }

  /**
   * Grabs the contents of an individual file on GitHub
   *
   * @param {string} path path to the file
   * @param {string} [ref] an optional sha
   * @returns {Promise<string>} text contents
   *
   */
  async fileContents(path: string, ref?: string): Promise<string> {
    // Use head of PR (current state of PR) if no ref passed
    if (!ref) {
      const prJSON = await this.getReviewInfo()
      ref = prJSON.head.ref
    }
    const fileMetadata = await this.getFileContents(path, ref)
    const data = await fileMetadata.json()
    const buffer = new Buffer(data.content, "base64")
    return buffer.toString()
  }

  // The above is the API for Platform

  async getDangerCommentID(): Promise<number | null> {
    const userID = await this.getUserID()
    const allCommentsResponse = await this.getPullRequestComments()
    const allComments: any[] = await allCommentsResponse.json()
    const dangerComment = find(allComments, (comment: any) => comment.user.id === userID)
    return dangerComment ? dangerComment.id : null
  }

  async updateCommentWithID(id: number, comment: string): Promise<any> {
    const repo = this.ciSource.repoSlug
    return this.patch(`repos/${repo}/issues/comments/${id}`, {}, {
      body: comment
    })
  }

  async deleteCommentWithID(id: number): Promise<any> {
    const repo = this.ciSource.repoSlug
    return this.get(`repos/${repo}/issues/comments/${id}`, {}, {}, "DELETE")
  }

  async getUserID(): Promise<number> {
    const info = await this.getUserInfo()
    return info.id
  }

  postPRComment(comment: string): Promise<any> {
    const repo = this.ciSource.repoSlug
    const prID = this.ciSource.pullRequestID
    return this.post(`repos/${repo}/issues/${prID}/comments`, {}, {
      body: comment
    })
  }

  getPullRequestInfo(): Promise<any> {
    const repo = this.ciSource.repoSlug
    const prID = this.ciSource.pullRequestID
    return this.get(`repos/${repo}/pulls/${prID}`)
  }

  async getUserInfo(): Promise<any> {
    const response: any = await this.get("user")
    return await response.json()
  }

  // TODO: This does not handle pagination
  getPullRequestComments(): Promise<any> {
    const repo = this.ciSource.repoSlug
    const prID = this.ciSource.pullRequestID
    return this.get(`repos/${repo}/issues/${prID}/comments`)
  }

  getPullRequestDiff(): Promise<any> {
    const repo = this.ciSource.repoSlug
    const prID = this.ciSource.pullRequestID
    return this.get(`repos/${repo}/pulls/${prID}`, {
      accept: "application/vnd.github.v3.diff"
    })
  }

  getFileContents(path: string, ref?: string): Promise<any> {
    const repo = this.ciSource.repoSlug
    return this.get(`repos/${repo}/contents/${path}?ref=${ref}`, {})
  }

  // maybe this can move into the stuff below
  post(path: string, headers: any = {}, body: any = {}, method: string = "POST"): Promise<any> {
    return this.fetch(`https://api.github.com/${path}`, {
      method: method,
      body: JSON.stringify(body),
      headers: {
        "Authorization": `token ${this.token}`,
        "Content-Type": "application/json",
        ...headers
      }
    })
  }

  get(path: string, headers: any = {}, body: any = {}, method: string = "GET"): Promise<any> {
    return this.fetch(`https://api.github.com/${path}`, {
      method: method,
      body: body,
      headers: {
        "Authorization": `token ${this.token}`,
        "Content-Type": "application/json",
        ...headers
      }
    })
  }

  patch(path: string, headers: any = {}, body: any = {}, method: string = "PATCH"): Promise<any> {
    return this.fetch(`https://api.github.com/${path}`, {
      method: method,
      body: JSON.stringify(body),
      headers: {
        "Authorization": `token ${this.token}`,
        "Content-Type": "application/json",
        ...headers
      }
    })
  }
}
