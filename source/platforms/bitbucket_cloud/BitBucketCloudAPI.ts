import { debug } from "../../debug"
import * as node_fetch from "node-fetch"
import { Agent } from "http"
import HttpsProxyAgent from "https-proxy-agent"
import { URLSearchParams } from "url"

import { Env } from "../../ci_source/ci_source"
import { dangerIDToString } from "../../runner/templates/bitbucketCloudTemplate"
import { api as fetch } from "../../api/fetch"
import {
  BitBucketCloudPagedResponse,
  BitBucketCloudPRDSL,
  BitBucketCloudCommit,
  BitBucketCloudPRActivity,
  BitBucketCloudPRComment,
} from "../../dsl/BitBucketCloudDSL"
import { Comment } from "../platform"
import { RepoMetaData } from "../../dsl/BitBucketServerDSL"

export type BitBucketCloudCredentials = {
  /** Unique ID for this user, must be wrapped with brackets */
  uuid?: string
} & (BitBucketCloudCredentialsOAuth | BitBucketCloudCredentialsPassword)

interface BitBucketCloudCredentialsOAuth {
  type: "OAUTH"
  oauthKey: string
  oauthSecret: string
}

interface BitBucketCloudCredentialsPassword {
  type: "PASSWORD"
  username: string
  password: string
}

export function bitbucketCloudCredentialsFromEnv(env: Env): BitBucketCloudCredentials {
  const uuid: string | undefined = env["DANGER_BITBUCKETCLOUD_UUID"]
  if (uuid != null && uuid.length > 0) {
    if (!uuid.startsWith("{") || !uuid.endsWith("}")) {
      throw new Error(`DANGER_BITBUCKETCLOUD_UUID must be wraped with brackets`)
    }
  }

  if (env["DANGER_BITBUCKETCLOUD_OAUTH_KEY"]) {
    if (!env["DANGER_BITBUCKETCLOUD_OAUTH_SECRET"]) {
      throw new Error(`DANGER_BITBUCKETCLOUD_OAUTH_SECRET is not set`)
    }
    return {
      type: "OAUTH",
      uuid,
      oauthKey: env["DANGER_BITBUCKETCLOUD_OAUTH_KEY"],
      oauthSecret: env["DANGER_BITBUCKETCLOUD_OAUTH_SECRET"],
    }
  } else if (env["DANGER_BITBUCKETCLOUD_USERNAME"]) {
    if (!env["DANGER_BITBUCKETCLOUD_PASSWORD"]) {
      throw new Error(`DANGER_BITBUCKETCLOUD_PASSWORD is not set`)
    }
    return {
      type: "PASSWORD",
      username: env["DANGER_BITBUCKETCLOUD_USERNAME"],
      password: env["DANGER_BITBUCKETCLOUD_PASSWORD"],
      uuid,
    }
  }
  throw new Error(`Either DANGER_BITBUCKETCLOUD_OAUTH_KEY or DANGER_BITBUCKETCLOUD_USERNAME is not set`)
}

export class BitBucketCloudAPI {
  fetch: typeof fetch
  accessToken: string | undefined
  uuid: string | undefined

  private readonly d = debug("BitBucketCloudAPI")
  private pr: BitBucketCloudPRDSL | undefined
  private commits: BitBucketCloudCommit[] | undefined
  private baseURL = "https://api.bitbucket.org/2.0"
  private oauthURL = "https://bitbucket.org/site/oauth2/access_token"

  constructor(public readonly repoMetadata: RepoMetaData, public readonly credentials: BitBucketCloudCredentials) {
    // This allows Peril to DI in a new Fetch function
    // which can handle unique API edge-cases around integrations
    this.fetch = fetch

    // Backward compatible,
    this.uuid = credentials.uuid
  }

  getBaseRepoURL() {
    const { repoSlug } = this.repoMetadata
    return `${this.baseURL}/repositories/${repoSlug}`
  }

  getPRURL() {
    const { pullRequestID } = this.repoMetadata
    return `${this.getBaseRepoURL()}/pullrequests/${pullRequestID}`
  }

  getPullRequestsFromBranch = async (branch: string): Promise<BitBucketCloudPRDSL[]> => {
    // Need to encode URI here because it used special characters in query params.
    // https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Busername%7D/%7Brepo_slug%7D/pullrequests
    let nextPageURL: string | undefined = encodeURI(
      `${this.getBaseRepoURL()}/pullrequests?q=source.branch.name = "${branch}"`
    )
    let values: BitBucketCloudPRDSL[] = []

    do {
      const res = await this.get(nextPageURL)
      throwIfNotOk(res)

      const data = (await res.json()) as BitBucketCloudPagedResponse<BitBucketCloudPRDSL>

      values = values.concat(data.values)

      nextPageURL = data.next
    } while (nextPageURL != null)

    return values
  }

  getPullRequestInfo = async (): Promise<BitBucketCloudPRDSL> => {
    if (this.pr) {
      return this.pr
    }
    const res = await this.get(this.getPRURL())
    throwIfNotOk(res)
    const prDSL = (await res.json()) as BitBucketCloudPRDSL
    this.pr = prDSL
    return prDSL
  }

  getPullRequestCommits = async (): Promise<BitBucketCloudCommit[]> => {
    if (this.commits) {
      return this.commits
    }
    let values: BitBucketCloudCommit[] = []

    // https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Busername%7D/%7Brepo_slug%7D/pullrequests/%7Bpull_request_id%7D/commits
    let nextPageURL: string | undefined = `${this.getPRURL()}/commits`

    do {
      const res = await this.get(nextPageURL)
      throwIfNotOk(res)

      const data = (await res.json()) as BitBucketCloudPagedResponse<BitBucketCloudCommit>

      values = values.concat(data.values)

      nextPageURL = data.next
    } while (nextPageURL != null)
    this.commits = values
    return values
  }

  getPullRequestDiff = async () => {
    // https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Busername%7D/%7Brepo_slug%7D/pullrequests/%7Bpull_request_id%7D/diff
    const res = await this.get(`${this.getPRURL()}/diff`)
    return res.ok ? res.text() : ""
  }

  getPullRequestComments = async (): Promise<BitBucketCloudPRComment[]> => {
    let values: BitBucketCloudPRComment[] = []

    // https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Busername%7D/%7Brepo_slug%7D/pullrequests/%7Bpull_request_id%7D/comments
    let nextPageURL: string | undefined = `${this.getPRURL()}/comments?q=deleted=false`

    do {
      const res = await this.get(nextPageURL)
      throwIfNotOk(res)

      const data = (await res.json()) as BitBucketCloudPagedResponse<BitBucketCloudPRComment>

      values = values.concat(data.values)

      nextPageURL = data.next
    } while (nextPageURL != null)

    return values
  }

  getPullRequestActivities = async (): Promise<BitBucketCloudPRActivity[]> => {
    let values: BitBucketCloudPRActivity[] = []

    // https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Busername%7D/%7Brepo_slug%7D/pullrequests/%7Bpull_request_id%7D/activity
    let nextPageURL: string | undefined = `${this.getPRURL()}/activity`

    do {
      const res = await this.get(nextPageURL)
      throwIfNotOk(res)

      const data = (await res.json()) as BitBucketCloudPagedResponse<BitBucketCloudPRActivity>

      values = values.concat(data.values)

      nextPageURL = data.next
    } while (nextPageURL != null)

    return values
  }

  getFileContents = async (filePath: string, repoSlug?: string, ref?: string) => {
    if (!repoSlug || !ref) {
      const prJSON = await this.getPullRequestInfo()
      repoSlug = prJSON.source.repository.full_name
      ref = prJSON.source.commit.hash
    }

    const url = `${this.baseURL}/repositories/${repoSlug}/src/${ref}/${filePath}`
    const res = await this.get(url, undefined, true)
    if (res.status === 404) {
      return ""
    }
    throwIfNotOk(res)
    return await res.text()
  }

  getDangerComments = async (dangerID: string): Promise<BitBucketCloudPRComment[]> => {
    const comments = await this.getPullRequestComments()
    const dangerIDMessage = dangerIDToString(dangerID)

    return comments
      .filter(comment => comment.content.raw.includes(dangerIDMessage))
      .filter(comment => comment.user.uuid === this.uuid)
  }

  getDangerInlineComments = async (dangerID: string): Promise<Comment[]> => {
    const comments = await this.getPullRequestComments()
    const dangerIDMessage = dangerIDToString(dangerID)

    return comments.filter(comment => comment.inline).map(comment => ({
      id: comment.id.toString(),
      ownedByDanger: comment.content.raw.includes(dangerIDMessage) && comment.user.uuid === this.uuid,
      body: comment.content.raw,
    }))
  }

  postBuildStatus = async (
    commitId: string,
    payload: {
      state: "SUCCESSFUL" | "FAILED" | "INPROGRESS" | "STOPPED"
      key: string
      name: string
      url: string
      description: string
    }
  ) => {
    // https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Busername%7D/%7Brepo_slug%7D/commit/%7Bnode%7D/statuses/build
    const res = await this.post(`${this.getBaseRepoURL()}/commit/${commitId}/statuses/build`, {}, payload)
    throwIfNotOk(res)

    return await res.json()
  }

  postPRComment = async (comment: string) => {
    const url = `${this.getPRURL()}/comments`
    const res = await this.post(url, {}, { content: { raw: comment } })
    return await res.json()
  }

  postInlinePRComment = async (comment: string, line: number, filePath: string) => {
    const url = `${this.getPRURL()}/comments`
    const res = await this.post(
      url,
      {},
      {
        content: {
          raw: comment,
        },
        inline: {
          to: line,
          path: filePath,
        },
      }
    )
    if (res.ok) {
      return res.json()
    } else {
      throw await res.json()
    }
  }

  deleteComment = async (id: string) => {
    const path = `${this.getPRURL()}/comments/${id}`
    const res = await this.delete(path)

    if (!res.ok) {
      throw new Error(`Failed to delete comment "${id}`)
    }
  }

  updateComment = async (id: string, comment: string) => {
    const path = `${this.getPRURL()}/comments/${id}`
    const res = await this.put(
      path,
      {},
      {
        content: {
          raw: comment,
        },
      }
    )
    if (res.ok) {
      return res.json()
    } else {
      throw await res.json()
    }
  }

  // API implementation
  private api = async (url: string, headers: any = {}, body: any = {}, method: string, suppressErrors?: boolean) => {
    if (this.credentials.type === "PASSWORD") {
      headers["Authorization"] = `Basic ${new Buffer(
        this.credentials.username + ":" + this.credentials.password
      ).toString("base64")}`
    } else {
      if (this.accessToken == null) {
        this.d(`accessToken not found, trying to get from ${this.oauthURL}.`)
        const params = new URLSearchParams()

        params.append("grant_type", "client_credentials")

        const authResponse = await this.performAPI(
          this.oauthURL,
          {
            ...headers,
            Authorization: `Basic ${new Buffer(this.credentials.oauthKey + ":" + this.credentials.oauthSecret).toString(
              "base64"
            )}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          params,
          "POST",
          suppressErrors
        )
        if (authResponse.ok) {
          const jsonResp = await authResponse.json()
          this.accessToken = jsonResp["access_token"]
        } else {
          throwIfNotOk(authResponse)
        }
      }

      headers["Authorization"] = `Bearer ${this.accessToken}`
    }

    if (this.uuid == null) {
      this.d(`UUID not found, trying to get from ${this.baseURL}/user`)
      const profileResponse = await this.performAPI(`${this.baseURL}/user`, headers, null, "GET", suppressErrors)
      if (profileResponse.ok) {
        const jsonResp = await profileResponse.json()
        this.uuid = jsonResp["uuid"]
      } else {
        let message = `${profileResponse.status} - ${profileResponse.statusText}`
        if (profileResponse.status >= 400 && profileResponse.status < 500) {
          message += ` (Have you allowed permission 'account' for this credential?)`
        }
        throw new Error(message)
      }
    }

    return this.performAPI(url, headers, body, method, suppressErrors)
  }

  private performAPI = (url: string, headers: any = {}, body: any = {}, method: string, suppressErrors?: boolean) => {
    this.d(`${method} ${url}`)
    // Allow using a proxy configured through environmental variables
    // Remember that to avoid the error "Error: self signed certificate in certificate chain"
    // you should also do: "export NODE_TLS_REJECT_UNAUTHORIZED=0". See: https://github.com/request/request/issues/2061
    let agent: Agent | undefined = undefined
    let proxy = process.env.http_proxy || process.env.https_proxy
    if (proxy) {
      agent = new HttpsProxyAgent(proxy)
    }

    return this.fetch(
      url,
      {
        method,
        body,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        agent,
      },
      suppressErrors
    )
  }

  get = (url: string, headers: any = {}, suppressErrors?: boolean): Promise<node_fetch.Response> =>
    this.api(url, headers, null, "GET", suppressErrors)

  post = (url: string, headers: any = {}, body: any = {}, suppressErrors?: boolean): Promise<node_fetch.Response> =>
    this.api(url, headers, JSON.stringify(body), "POST", suppressErrors)

  put = (url: string, headers: any = {}, body: any = {}): Promise<node_fetch.Response> =>
    this.api(url, headers, JSON.stringify(body), "PUT")

  delete = (url: string, headers: any = {}, body: any = {}): Promise<node_fetch.Response> =>
    this.api(url, headers, JSON.stringify(body), "DELETE")
}

function throwIfNotOk(res: node_fetch.Response) {
  if (!res.ok) {
    let message = `${res.status} - ${res.statusText}`
    if (res.status >= 400 && res.status < 500) {
      message += ` (Have you set DANGER_BITBUCKETCLOUD_USERNAME or DANGER_BITBUCKETCLOUD_OAUTH_KEY?)`
    }
    throw new Error(message)
  }
}
