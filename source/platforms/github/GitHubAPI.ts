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

  constructor(public readonly token: APIToken | undefined, public readonly ciSource: CISource) {
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
      const pr = await this.getPullRequestInfo()
      const prJSON = await pr.json()

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
    return this.api(`repos/${repo}/issues/comments/${id}`, {}, {}, "DELETE")
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

  getPullRequestCommits(): Promise<any> {
    const repo = this.ciSource.repoSlug
    const prID = this.ciSource.pullRequestID
    return this.get(`repos/${repo}/pulls/${prID}/commits`)
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

  async getPullRequests(): Promise<any> {
    const repo = this.ciSource.repoSlug
    const res = await this.get(`repos/${repo}/pulls`)
    if (res.ok) {
      return res.json()
    }
    return []
  }

  private api(path: string, headers: any = {}, body: any = {}, method: string): Promise<any> {
    if (this.token !== undefined) {
      headers["Authorization"] = `token ${this.token}`
    }

    return this.fetch(`https://api.github.com/${path}`, {
      method: method,
      body: body,
      headers: {
        "Content-Type": "application/json",
        ...headers,
        ...this.additionalHeaders
      }
    })
  }

  get(path: string, headers: any = {}, body: any = {}): Promise<any> {
    return this.api(path, headers, body, "GET")
  }

  post(path: string, headers: any = {}, body: any = {}): Promise<any> {
    return this.api(path, headers, JSON.stringify(body), "POST")
  }

  patch(path: string, headers: any = {}, body: any = {}): Promise<any> {
    return this.api(path, headers, JSON.stringify(body), "PATCH")
  }
}
