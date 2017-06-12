import { api as fetch } from "../../api/fetch"
import { RepoMetaData } from "../../ci_source/ci_source"
import { GitHubPRDSL, GitHubUser } from "../../dsl/GitHubDSL"
import * as find from "lodash.find"
import * as v from "voca"

import * as node_fetch from "node-fetch"
import * as GitHubNodeAPI from "github"
import { dangerSignaturePostfix } from "../../runner/templates/githubIssueTemplate"

// The Handle the API specific parts of the github

export type APIToken = string

// Note that there are parts of this class which don't seem to be
// used by Danger, they are exposed for Peril support.

/** This represent the GitHub API */

export class GitHubAPI {
  fetch: typeof fetch
  additionalHeaders: any

  constructor(public readonly repoMetadata: RepoMetaData, public readonly token?: APIToken) {
    // This allows Peril to DI in a new Fetch function
    // which can handle unique API edge-cases around integrations
    this.fetch = fetch
    this.additionalHeaders = {}
  }

  /**
   * Bit weird, yes, but we want something that can be exposed to an end-user.
   * I wouldn't have a problem with moving this to use this API under the hood
   * but for now that's just a refactor someone can try.
   */
  getExternalAPI(): GitHubNodeAPI {
    const baseUrl = process.env["DANGER_GITHUB_API_BASE_URL"] || null
    const api = new GitHubNodeAPI({
      host: baseUrl,
      headers: {
        ...this.additionalHeaders,
      },
    })

    if (this.token) {
      api.authenticate({ type: "token", token: this.token })
    }
    return api
  }

  /**
   * Grabs the contents of an individual file on GitHub
   *
   * @param {string} path path to the file
   * @param {string} [ref] an optional sha
   * @returns {Promise<string>} text contents
   *
   */
  async fileContents(path: string, repoSlug?: string, ref?: string): Promise<string> {
    // Use the current state of PR if no repo/ref is passed
    if (!repoSlug || !ref) {
      const prJSON = await this.getPullRequestInfo()
      repoSlug = prJSON.head.repo.full_name
      ref = prJSON.head.ref
    }

    const data = await this.getFileContents(path, repoSlug, ref)
    const buffer = new Buffer(data.content, "base64")
    return buffer.toString()
  }

  // The above is the API for Platform

  async getDangerCommentID(): Promise<number | null> {
    const userID = await this.getUserID()
    const allComments: any[] = await this.getPullRequestComments()
    const dangerComment = find(
      allComments,
      (comment: any) => comment.user.id === userID && v.includes(comment.body, dangerSignaturePostfix)
    )
    return dangerComment ? dangerComment.id : null
  }

  async updateCommentWithID(id: number, comment: string): Promise<any> {
    const repo = this.repoMetadata.repoSlug
    const res = await this.patch(
      `repos/${repo}/issues/comments/${id}`,
      {},
      {
        body: comment,
      }
    )

    return res.json()
  }

  async deleteCommentWithID(id: number): Promise<boolean> {
    const repo = this.repoMetadata.repoSlug
    const res = await this.api(`repos/${repo}/issues/comments/${id}`, {}, {}, "DELETE")

    //https://developer.github.com/v3/issues/comments/#response-5
    return Promise.resolve(res.status === 204)
  }

  async getUserID(): Promise<number> {
    const info = await this.getUserInfo()
    return info.id
  }

  async postPRComment(comment: string): Promise<any> {
    const repo = this.repoMetadata.repoSlug
    const prID = this.repoMetadata.pullRequestID
    const res = await this.post(
      `repos/${repo}/issues/${prID}/comments`,
      {},
      {
        body: comment,
      }
    )

    return res.json()
  }

  async getPullRequestInfo(): Promise<GitHubPRDSL> {
    const repo = this.repoMetadata.repoSlug
    const prID = this.repoMetadata.pullRequestID
    const res = await this.get(`repos/${repo}/pulls/${prID}`)

    return res.ok ? res.json() as Promise<GitHubPRDSL> : {} as GitHubPRDSL
  }

  async getPullRequestCommits(): Promise<any> {
    const repo = this.repoMetadata.repoSlug
    const prID = this.repoMetadata.pullRequestID
    const res = await this.get(`repos/${repo}/pulls/${prID}/commits`)

    return res.ok ? res.json() : []
  }

  async getUserInfo(): Promise<GitHubUser> {
    const response: any = await this.get("user")

    return response.json()
  }

  // TODO: This does not handle pagination
  async getPullRequestComments(): Promise<any> {
    const repo = this.repoMetadata.repoSlug
    const prID = this.repoMetadata.pullRequestID
    const res = await this.get(`repos/${repo}/issues/${prID}/comments`)

    return res.ok ? res.json() : []
  }

  async getPullRequestDiff(): Promise<string> {
    const repo = this.repoMetadata.repoSlug
    const prID = this.repoMetadata.pullRequestID
    const res = await this.get(`repos/${repo}/pulls/${prID}`, {
      accept: "application/vnd.github.v3.diff",
    })

    return res.ok ? res.text() : ""
  }

  async getFileContents(path: string, repoSlug: string, ref: string): Promise<any> {
    const res = await this.get(`repos/${repoSlug}/contents/${path}?ref=${ref}`)
    return res.ok ? res.json() : { content: "" }
  }

  async getPullRequests(): Promise<any> {
    const repo = this.repoMetadata.repoSlug
    const res = await this.get(`repos/${repo}/pulls`)

    return res.ok ? res.json : []
  }

  async getReviewerRequests(): Promise<any> {
    const repo = this.repoMetadata.repoSlug
    const prID = this.repoMetadata.pullRequestID
    const res = await this.get(`repos/${repo}/pulls/${prID}/requested_reviewers`, {
      accept: "application/vnd.github.black-cat-preview+json",
    })

    return res.ok ? res.json() : []
  }

  async getReviews(): Promise<any> {
    const repo = this.repoMetadata.repoSlug
    const prID = this.repoMetadata.pullRequestID
    const res = await this.get(`repos/${repo}/pulls/${prID}/reviews`, {
      accept: "application/vnd.github.black-cat-preview+json",
    })

    return res.ok ? res.json() : []
  }

  async getIssue(): Promise<any> {
    const repo = this.repoMetadata.repoSlug
    const prID = this.repoMetadata.pullRequestID
    const res = await this.get(`repos/${repo}/issues/${prID}`)

    return res.ok ? res.json() : { labels: [] }
  }

  async updateStatus(passed: boolean, message: string): Promise<any> {
    const repo = this.repoMetadata.repoSlug

    const prJSON = await this.getPullRequestInfo()
    const ref = prJSON.head.sha
    try {
      const res = await this.post(
        `repos/${repo}/statuses/${ref}`,
        {},
        {
          state: passed ? "success" : "failure",
          context: "Danger",
          target_url: "https://danger.systems/js",
          description: message,
        }
      )
      return res.ok
    } catch (error) {
      return false
    }
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
        ...this.additionalHeaders,
      },
    })
  }

  get(path: string, headers: any = {}, body: any = {}): Promise<node_fetch.Response> {
    return this.api(path, headers, body, "GET")
  }

  post(path: string, headers: any = {}, body: any = {}): Promise<node_fetch.Response> {
    return this.api(path, headers, JSON.stringify(body), "POST")
  }

  patch(path: string, headers: any = {}, body: any = {}): Promise<node_fetch.Response> {
    return this.api(path, headers, JSON.stringify(body), "PATCH")
  }
}
