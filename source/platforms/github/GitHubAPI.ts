import GitHubNodeAPI = require("@octokit/rest")
import { debug } from "../../debug"
import * as node_fetch from "node-fetch"
import parse from "parse-link-header"
import v from "voca"
import pLimit from "p-limit"

import { GitHubPRDSL, GitHubUser } from "../../dsl/GitHubDSL"

import { dangerSignaturePostfix, dangerIDToString } from "../../runner/templates/githubIssueTemplate"
import { api as fetch } from "../../api/fetch"
import { Comment } from "../platform"
import { RepoMetaData } from "../../dsl/BitBucketServerDSL"
import { CheckOptions } from "./comms/checks/resultsToCheck"

// The Handle the API specific parts of the github

export type APIToken = string

const limit = pLimit(25)

// Note that there are parts of this class which don't seem to be
// used by Danger, they are exposed for Peril support.

/** This represent the GitHub API */

export class GitHubAPI {
  fetch: typeof fetch
  additionalHeaders: any
  private readonly d = debug("GitHubAPI")

  private pr: GitHubPRDSL | undefined

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
  getExternalAPI = (accessTokenForApp?: string): GitHubNodeAPI => {
    const host = process.env["DANGER_GITHUB_API_BASE_URL"] || undefined
    const options: GitHubNodeAPI.Options & { debug: boolean } = {
      debug: !!process.env.LOG_FETCH_REQUESTS,
      baseUrl: host,
      headers: {
        ...this.additionalHeaders,
      },
    }
    // A token should have been set by this point
    const token = accessTokenForApp || this.token!

    const api = new GitHubNodeAPI(options)
    api.authenticate({ type: "token", token: token })

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
  fileContents = async (path: string, repoSlug?: string, ref?: string): Promise<string> => {
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

  getDangerCommentIDs = async (dangerID: string): Promise<number[]> => {
    const userID = await this.getUserID()
    const allComments: any[] = await this.getPullRequestComments()
    const dangerIDMessage = dangerIDToString(dangerID)
    this.d(`User ID: ${userID}`)
    this.d(`Looking at ${allComments.length} comments for ${dangerIDMessage}`)
    return allComments
      .filter(comment => v.includes(comment.body, dangerIDMessage)) // does it contain the right danger ID?
      .filter(comment => comment.user.id === userID) // Does it have the right user ID?
      .filter(comment => v.includes(comment.body, dangerSignaturePostfix)) // Does it look like a danger message?
      .map(comment => comment.id) // only return IDs
  }

  updateCommentWithID = async (id: number, comment: string): Promise<any> => {
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

  deleteCommentWithID = async (id: number): Promise<boolean> => {
    const repo = this.repoMetadata.repoSlug
    const res = await this.api(`repos/${repo}/issues/comments/${id}`, {}, null, "DELETE")

    //https://developer.github.com/v3/issues/comments/#response-5
    return Promise.resolve(res.status === 204)
  }

  deleteInlineCommentWithID = async (id: string): Promise<boolean> => {
    const repo = this.repoMetadata.repoSlug
    const res = await this.api(`repos/${repo}/pulls/comments/${id}`, {}, null, "DELETE", false)

    //https://developer.github.com/v3/pulls/comments/#response-5
    return Promise.resolve(res.status === 204)
  }

  getUserID = async (): Promise<number | undefined> => {
    const perilID = process.env["PERIL_BOT_USER_ID"]
    if (perilID) {
      return parseInt(perilID)
    }

    const info = await this.getUserInfo()
    return info.id
  }

  postPRComment = async (comment: string): Promise<any> => {
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

  postInlinePRComment = async (comment: string, commitId: string, path: string, position: number) => {
    const repo = this.repoMetadata.repoSlug
    const prID = this.repoMetadata.pullRequestID
    const res = await this.post(
      `repos/${repo}/pulls/${prID}/comments`,
      {},
      {
        body: comment,
        commit_id: commitId,
        path: path,
        position: position,
      },
      false
    )
    if (res.ok) {
      return res.json()
    } else {
      throw await res.json()
    }
  }

  updateInlinePRComment = async (comment: string, commentId: string) => {
    const repo = this.repoMetadata.repoSlug
    const res = await this.patch(
      `repos/${repo}/pulls/comments/${commentId}`,
      {},
      {
        body: comment,
      },
      false
    )
    if (res.ok) {
      return res.json()
    } else {
      throw await res.json()
    }
  }

  getPullRequestInfo = async (): Promise<GitHubPRDSL> => {
    if (this.pr) {
      return this.pr
    }
    const repo = this.repoMetadata.repoSlug
    const prID = this.repoMetadata.pullRequestID
    const res = await this.get(`repos/${repo}/pulls/${prID}`)
    const prDSL = (await res.json()) as GitHubPRDSL
    this.pr = prDSL

    if (res.ok) {
      return prDSL
    } else {
      throw `Could not get PR Metadata for repos/${repo}/pulls/${prID}`
    }
  }

  getPullRequestCommits = async (): Promise<any[]> => {
    const repo = this.repoMetadata.repoSlug
    const prID = this.repoMetadata.pullRequestID
    return await this.getAllOfResource(`repos/${repo}/pulls/${prID}/commits`)
  }

  /**
   * Get list of commits in pull requests. This'll try to iterate all available pages
   * Until it reaches hard limit of api itself (250 commits).
   * https://developer.github.com/v3/pulls/#list-commits-on-a-pull-request
   *
   */
  getAllOfResource = async (path: string): Promise<any> => {
    const ret: Array<any> = []

    /**
     * Read response header and locate next page for pagination via link header.
     * If not found, will return -1.
     *
     * @param response Github API response sent via node-fetch
     */
    const getNextPageFromLinkHeader = (response: node_fetch.Response): number => {
      const linkHeader = response.headers.get("link")
      if (!linkHeader) {
        this.d(`getNextPageFromLinkHeader:: Given response does not contain link header for pagination`)
        return -1
      }

      const parsedHeader = parse(linkHeader)
      this.d(`getNextPageFromLinkHeader:: Link header found`, parsedHeader)
      if (!!parsedHeader.next && !!parsedHeader.next.page) {
        return parsedHeader.next.page
      }
      return -1
    }

    //iterates commit request pages until next page's not available, or response failed for some reason.
    let page = 0
    while (page >= 0) {
      const requestUrl = `${path}${page > 0 ? `?page=${page}` : ""}`
      this.d(`getPullRequestCommits:: Sending pull request commit request for ${page === 0 ? "first" : `${page}`} page`)
      this.d(`getPullRequestCommits:: Request url generated "${requestUrl}"`)

      const response = await this.get(requestUrl)
      if (response.ok) {
        ret.push(...(await response.json()))
        page = getNextPageFromLinkHeader(response)
      } else {
        this.d(
          `getPullRequestCommits:: Failed to get response while traverse page ${page} with ${
            response.status
          }, bailing rest of pages if exists`
        )
        page = -1
      }
    }

    return ret
  }

  getUserInfo = async (): Promise<GitHubUser> => {
    const response = await this.get("user")
    return response.json()
  }

  getPullRequestComments = async (): Promise<any[]> => {
    const repo = this.repoMetadata.repoSlug
    const prID = this.repoMetadata.pullRequestID
    return await this.getAllOfResource(`repos/${repo}/issues/${prID}/comments`)
  }

  getPullRequestInlineComments = async (dangerID: string): Promise<Comment[]> => {
    const userID = await this.getUserID()
    const repo = this.repoMetadata.repoSlug
    const prID = this.repoMetadata.pullRequestID
    return await this.getAllOfResource(`repos/${repo}/pulls/${prID}/comments`).then(v => {
      return v
        .filter(Boolean)
        .map((i: any) => {
          return { id: i.id, ownedByDanger: i.user.id == userID && i.body.includes(dangerID), body: i.body }
        })
        .filter((i: any) => i.ownedByDanger)
    })
  }

  getPullRequestDiff = async () => {
    const repo = this.repoMetadata.repoSlug
    const prID = this.repoMetadata.pullRequestID
    const res = await this.get(`repos/${repo}/pulls/${prID}`, {
      Accept: "application/vnd.github.v3.diff",
    })
    return res.ok ? res.text() : ""
  }

  getFileContents = async (path: string, repoSlug: string, ref: string): Promise<any> => {
    const res = await this.get(`repos/${repoSlug}/contents/${path}?ref=${ref}`)
    return res.ok ? res.json() : { content: "" }
  }

  getPullRequests = async (): Promise<any> => {
    const repo = this.repoMetadata.repoSlug
    const res = await this.get(`repos/${repo}/pulls`)

    return res.ok ? res.json() : []
  }

  getReviewerRequests = async (): Promise<any> => {
    const repo = this.repoMetadata.repoSlug
    const prID = this.repoMetadata.pullRequestID
    const res = await this.get(`repos/${repo}/pulls/${prID}/requested_reviewers`, {
      Accept: "application/vnd.github.v3+json",
    })

    return res.ok ? res.json() : []
  }

  getReviews = async (): Promise<any> => {
    const repo = this.repoMetadata.repoSlug
    const prID = this.repoMetadata.pullRequestID
    const res = await this.get(`repos/${repo}/pulls/${prID}/reviews`, {
      Accept: "application/vnd.github.v3+json",
    })

    return res.ok ? res.json() : []
  }

  getIssue = async (): Promise<any> => {
    const repo = this.repoMetadata.repoSlug
    const prID = this.repoMetadata.pullRequestID
    const res = await this.get(`repos/${repo}/issues/${prID}`)

    return res.ok ? res.json() : { labels: [] }
  }

  updateStatus = async (passed: boolean, message: string, url?: string): Promise<any> => {
    const repo = this.repoMetadata.repoSlug

    const prJSON = await this.getPullRequestInfo()
    const ref = prJSON.head.sha
    const res = await this.post(
      `repos/${repo}/statuses/${ref}`,
      {},
      {
        state: passed ? "success" : "failure",
        context: process.env["PERIL_INTEGRATION_ID"] ? "Peril" : "Danger",
        target_url: url || "http://danger.systems/js",
        description: message,
      }
    )

    return res.ok
  }

  postCheck = async (check: CheckOptions, token: string) => {
    const repo = this.repoMetadata.repoSlug
    const res = await this.post(
      `repos/${repo}/check-runs`,
      {
        Accept: "application/vnd.github.antiope-preview+json,application/vnd.github.machine-man-preview+json",
        Authorization: `token ${token}`,
      },
      check
    )
    if (res.ok) {
      return res.json()
    } else {
      throw await res.json()
    }
  }

  // API Helpers

  private api = (path: string, headers: any = {}, body: any = {}, method: string, suppressErrors?: boolean) => {
    if (this.token && !headers["Authorization"]) {
      headers["Authorization"] = `token ${this.token}`
    }

    const containsBase = path.startsWith("http")
    const baseUrl = process.env["DANGER_GITHUB_API_BASE_URL"] || "https://api.github.com"
    const url = containsBase ? path : `${baseUrl}/${path}`

    let customAccept = {}
    if (headers.Accept && this.additionalHeaders.Accept) {
      // We need to merge the accepts which are comma separated according to the HTML spec
      // e.g. https://gist.github.com/LTe/5270348

      // But make sure it doesn't already include it
      if (headers.Accept.includes(this.additionalHeaders.Accept)) {
        // If it's already a subset, ignore
        customAccept = { Accept: headers.Accept }
      } else {
        customAccept = { Accept: `${this.additionalHeaders.Accept}, ${headers.Accept}` }
      }
    }
    const finalHeaders = {
      "Content-Type": "application/json",
      ...headers,
      ...this.additionalHeaders,
      ...customAccept,
    }

    this.d("Sending: ", url, finalHeaders)
    return limit(() =>
      this.fetch(
        url,
        {
          method,
          body,
          headers: finalHeaders,
        },
        suppressErrors
      )
    )
  }

  get = (path: string, headers: any = {}): Promise<node_fetch.Response> => this.api(path, headers, null, "GET")

  post = (path: string, headers: any = {}, body: any = {}, suppressErrors?: boolean): Promise<node_fetch.Response> =>
    this.api(path, headers, JSON.stringify(body), "POST", suppressErrors)

  patch = (path: string, headers: any = {}, body: any = {}, suppressErrors?: boolean): Promise<node_fetch.Response> =>
    this.api(path, headers, JSON.stringify(body), "PATCH", suppressErrors)
}
