import { api as fetch } from "../../api/fetch"
import { CISource } from "../../ci_source/ci_source"
import * as find from "lodash.find"

// The Handle the API specific parts of the github

export type APIToken = string

// Note that there are parts of this class which don't seem to be
// used by Danger, they are exposed for Peril support.

/** This represent the GitHub API */

export class GitHubAPI {
  fetch: typeof fetch
  additionalHeaders: any

  constructor(public readonly ciSource: CISource, public readonly token?: APIToken) {
    // This allows Peril to DI in a new Fetch function
    // which can handle unique API edge-cases around integrations
    this.fetch = fetch
    this.additionalHeaders = {}
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
      const prJSON = await this.getPullRequestInfo()

      ref = prJSON.head.ref
    }
    const data = await this.getFileContents(path, ref)
    const buffer = new Buffer(data.content, "base64")
    return buffer.toString()
  }

  // The above is the API for Platform

  async getDangerCommentID(): Promise<number | null> {
    const userID = await this.getUserID()
    const allComments: any[] = await this.getPullRequestComments()
    const dangerComment = find(allComments, (comment: any) => comment.user.id === userID)
    return dangerComment ? dangerComment.id : null
  }

  async updateCommentWithID(id: number, comment: string): Promise<any> {
    const repo = this.ciSource.repoSlug
    const res = await this.patch(`repos/${repo}/issues/comments/${id}`, {}, {
      body: comment
    })

    return res.json()
  }

  async deleteCommentWithID(id: number): Promise<any> {
    const repo = this.ciSource.repoSlug
    const res = await this.api(`repos/${repo}/issues/comments/${id}`, {}, {}, "DELETE")

    return res.json()
  }

  async getUserID(): Promise<number> {
    const info = await this.getUserInfo()
    return info.id
  }

  async postPRComment(comment: string): Promise<any> {
    const repo = this.ciSource.repoSlug
    const prID = this.ciSource.pullRequestID
    const res = await this.post(`repos/${repo}/issues/${prID}/comments`, {}, {
      body: comment
    })

    return res.json()
  }

  async getPullRequestInfo(): Promise<any> {
    const repo = this.ciSource.repoSlug
    const prID = this.ciSource.pullRequestID
    const res = await this.get(`repos/${repo}/pulls/${prID}`)

    return res.ok ?  res.json() : {}
  }

  async getPullRequestCommits(): Promise<any> {
    const repo = this.ciSource.repoSlug
    const prID = this.ciSource.pullRequestID
    const res = await this.get(`repos/${repo}/pulls/${prID}/commits`)

    return res.ok ? res.json() : []
  }

  async getUserInfo(): Promise<any> {
    const response: any = await this.get("user")

    return response.json()
  }

  // TODO: This does not handle pagination
  async getPullRequestComments(): Promise<any> {
    const repo = this.ciSource.repoSlug
    const prID = this.ciSource.pullRequestID
    const res = await this.get(`repos/${repo}/issues/${prID}/comments`)

    return res.ok ? res.json() : []
  }

  async getPullRequestDiff(): Promise<string> {
    const repo = this.ciSource.repoSlug
    const prID = this.ciSource.pullRequestID
    const res = await this.get(`repos/${repo}/pulls/${prID}`, {
      accept: "application/vnd.github.v3.diff"
    })

    return res.ok ? res.text() : ""
  }

  async getFileContents(path: string, ref?: string): Promise<any> {
    const repo = this.ciSource.repoSlug
    const res = await this.get(`repos/${repo}/contents/${path}?ref=${ref}`)

    return res.ok ? res.json() : { content: "" }
  }

  async getPullRequests(): Promise<any> {
    const repo = this.ciSource.repoSlug
    const res = await this.get(`repos/${repo}/pulls`)

    return res.ok ? res.json : []
  }

  async getReviewerRequests(): Promise<any> {
    const repo = this.ciSource.repoSlug
    const prID = this.ciSource.pullRequestID
    const res = await this.get(`repos/${repo}/pulls/${prID}/requested_reviewers`, {
      accept: "application/vnd.github.black-cat-preview+json"
    })

    return res.ok ? res.json() : []
  }

  async getReviews(): Promise<any> {
    const repo = this.ciSource.repoSlug
    const prID = this.ciSource.pullRequestID
    const res = await this.get(`repos/${repo}/pulls/${prID}/reviews`, {
      accept: "application/vnd.github.black-cat-preview+json"
    })

    return res.ok ? res.json() : []
  }

  async getIssue(): Promise<any> {
    const repo = this.ciSource.repoSlug
    const prID = this.ciSource.pullRequestID
    const res = await this.get(`repos/${repo}/issues/${prID}`)

    return res.ok ? res.json() : { labels: [] }
  }

  // API Helpers

  private api(path: string, headers: any = {}, body: any = {}, method: string) {
    if (this.token) {
      headers["Authorization"] = `token ${this.token}`
    }

    const baseUrl = process.env["DANGER_GITHUB_API_BASE_URL"] || "https://api.github.com"
    return this.fetch(`${baseUrl}/${path}`, {
      method: method,
      body: body,
      headers: {
        "Content-Type": "application/json",
        ...headers,
        ...this.additionalHeaders
      }
    })
  }

  get(path: string, headers: any = {}, body: any = {}) {
    return this.api(path, headers, body, "GET")
  }

  post(path: string, headers: any = {}, body: any = {}) {
    return this.api(path, headers, JSON.stringify(body), "POST")
  }

  patch(path: string, headers: any = {}, body: any = {}) {
    return this.api(path, headers, JSON.stringify(body), "PATCH")
  }
}
