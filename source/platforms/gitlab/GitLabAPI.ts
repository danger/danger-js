import { RepoMetaData } from "../../dsl/BitBucketServerDSL"
import { api as fetch } from "../../api/fetch"
import {
  GitLabDiscussionTextPosition,
  GitLabInlineNote,
  GitLabMR,
  GitLabMRChange,
  GitLabMRChanges,
  GitLabMRCommit,
  GitLabNote,
  GitLabUserProfile,
} from "../../dsl/GitLabDSL"

import { Gitlab } from "gitlab"
import { Env } from "../../ci_source/ci_source"
import { debug } from "../../debug"

export type GitLabAPIToken = string

export interface GitLabAPICredentials {
  host: string
  token: GitLabAPIToken
}

export function getGitLabAPICredentialsFromEnv(env: Env): GitLabAPICredentials {
  let host = "https://gitlab.com"
  const envHost = env["DANGER_GITLAB_HOST"]
  const envCIAPI = env["CI_API_V4_URL"]

  if (envHost) {
    // We used to support DANGER_GITLAB_HOST being just the host e.g. "gitlab.com"
    // however it is possible to have a custom host without SSL, ensure we only add the protocol if one is not provided
    const protocolRegex = /^https?:\/\//i
    host = protocolRegex.test(envHost) ? envHost : `https://${envHost}`
  } else if (envCIAPI) {
    // GitLab >= v11.7 supplies the API Endpoint in an environment variable and we can work out our host value from that.
    // See https://docs.gitlab.com/ce/ci/variables/predefined_variables.html
    const hostRegex = /^(https?):\/\/([^\/]+)\//i
    if (hostRegex.test(envCIAPI)) {
      const matches = hostRegex.exec(envCIAPI)!
      const matchProto = matches[1]
      const matchHost = matches[2]
      host = `${matchProto}://${matchHost}`
    }
  }

  return {
    host,
    token: env["DANGER_GITLAB_API_TOKEN"],
  }
}

class GitLabAPI {
  fetch: typeof fetch
  private api: any
  private readonly hostURL: string
  private readonly d = debug("GitLabAPI")

  constructor(public readonly repoMetadata: RepoMetaData, public readonly repoCredentials: GitLabAPICredentials) {
    this.fetch = fetch
    this.api = new Gitlab(repoCredentials)
    this.hostURL = repoCredentials.host
  }

  get projectURL(): string {
    return `${this.hostURL}/${this.repoMetadata.repoSlug}`
  }

  get mergeRequestURL(): string {
    return `${this.projectURL}/merge_requests/${this.repoMetadata.pullRequestID}`
  }

  getUser = async (): Promise<GitLabUserProfile> => {
    this.d("getUser")
    const user: GitLabUserProfile = await this.api.Users.current()
    this.d("getUser", user)
    return user
  }

  getMergeRequestInfo = async (): Promise<GitLabMR> => {
    this.d(`getMergeRequestInfo for repo: ${this.repoMetadata.repoSlug} pr: ${this.repoMetadata.pullRequestID}`)
    const mr: GitLabMR = await this.api.MergeRequests.show(this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID)
    this.d("getMergeRequestInfo", mr)
    return mr
  }

  getMergeRequestChanges = async (): Promise<GitLabMRChange[]> => {
    this.d(`getMergeRequestChanges for repo: ${this.repoMetadata.repoSlug} pr: ${this.repoMetadata.pullRequestID}`)
    const mr = (await this.api.MergeRequests.changes(
      this.repoMetadata.repoSlug,
      this.repoMetadata.pullRequestID
    )) as GitLabMRChanges

    this.d("getMergeRequestChanges", mr.changes)
    return mr.changes
  }

  getMergeRequestCommits = async (): Promise<GitLabMRCommit[]> => {
    this.d("getMergeRequestCommits", this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID)
    const commits: GitLabMRCommit[] = await this.api.MergeRequests.commits(
      this.repoMetadata.repoSlug,
      this.repoMetadata.pullRequestID
    )
    this.d("getMergeRequestCommits", commits)
    return commits
  }

  getMergeRequestNotes = async (): Promise<GitLabNote[]> => {
    this.d("getMergeRequestNotes", this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID)
    const api = this.api.MergeRequestNotes
    const notes: GitLabNote[] = await api.all(this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID)
    this.d("getMergeRequestNotes", notes)
    return notes
  }

  getMergeRequestInlineNotes = async (): Promise<GitLabInlineNote[]> => {
    this.d("getMergeRequestInlineNotes")
    const notes: GitLabNote[] = await this.getMergeRequestNotes()
    const inlineNotes = notes.filter((note: GitLabNote) => note.type == "DiffNote") as GitLabInlineNote[]
    this.d("getMergeRequestInlineNotes", inlineNotes)
    return inlineNotes
  }

  createMergeRequestDiscussion = async (content: string, position: GitLabDiscussionTextPosition): Promise<string> => {
    this.d(
      "createMergeRequestDiscussion",
      this.repoMetadata.repoSlug,
      this.repoMetadata.pullRequestID,
      content,
      position
    )
    const api = this.api.MergeRequestDiscussions

    try {
      const result: string = await api.create(this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID, content, {
        position: position,
      })
      this.d("createMergeRequestDiscussion", result)
      return result
    } catch (e) {
      this.d("createMergeRequestDiscussion", e)
      throw e
    }
  }

  createMergeRequestNote = async (body: string): Promise<GitLabNote> => {
    this.d("createMergeRequestNote", this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID, body)
    const api = this.api.MergeRequestNotes

    try {
      this.d("createMergeRequestNote")
      const note: GitLabNote = await api.create(this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID, body)
      this.d("createMergeRequestNote", note)
      return note
    } catch (e) {
      this.d("createMergeRequestNote", e)
    }

    return Promise.reject()
  }

  updateMergeRequestNote = async (id: number, body: string): Promise<GitLabNote> => {
    this.d("updateMergeRequestNote", this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID, id, body)
    const api = this.api.MergeRequestNotes
    try {
      const note: GitLabNote = await api.edit(this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID, id, body)
      this.d("updateMergeRequestNote", note)
      return note
    } catch (e) {
      this.d("updateMergeRequestNote", e)
    }

    return Promise.reject()
  }

  // note: deleting the _only_ note in a discussion also deletes the discussion \o/
  deleteMergeRequestNote = async (id: number): Promise<boolean> => {
    this.d("deleteMergeRequestNote", this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID, id)
    const api = this.api.MergeRequestNotes

    try {
      await api.remove(this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID, id)
      this.d("deleteMergeRequestNote", true)
      return true
    } catch (e) {
      this.d("deleteMergeRequestNote", e)
      return false
    }
  }

  getFileContents = async (path: string, slug?: string, ref?: string): Promise<string> => {
    this.d(`getFileContents requested for path:${path}, slug:${slug}, ref:${ref}`)
    const api = this.api.RepositoryFiles
    const projectId = slug || this.repoMetadata.repoSlug
    // Use the current state of PR if no ref is passed
    if (!ref) {
      const mr: GitLabMR = await this.getMergeRequestInfo()
      ref = mr.diff_refs.head_sha
    }

    try {
      this.d("getFileContents", projectId, path, ref)
      const response = await api.show(projectId, path, ref)
      const result: string = Buffer.from(response.content, "base64").toString()
      this.d("getFileContents", result)
      return result
    } catch (e) {
      this.d("getFileContents", e)
      // GitHubAPI.fileContents returns "" when the file does not exist, keep it consistent across providers
      if (e.response.status === 404) {
        return ""
      }
      throw e
    }
  }
}

export default GitLabAPI
