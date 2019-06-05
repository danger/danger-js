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

export type GitLabAPIToken = string

export interface GitLabAPICredentials {
  host: string
  token: string
}

export function getGitLabAPICredentialsFromEnv(env: Env): GitLabAPICredentials {
  let host = "https://gitlab.com"
  const envHost = env["DANGER_GITLAB_HOST"]
  if (envHost) {
    // We used to support DANGER_GITLAB_HOST being just the host e.g. "gitlab.com"
    // however it is possible to have a custom host without SSL, ensure we only add the protocol if one is not provided
    const protocolRegex = /^http(s)*?:\/\//i
    host = protocolRegex.test(envHost) ? envHost : `https://${envHost}`
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
    return (await this.api.Users.current()) as GitLabUserProfile
  }

  getMergeRequestInfo = async (): Promise<GitLabMR> => {
    return (await this.api.MergeRequests.show(this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID)) as GitLabMR
  }

  getMergeRequestChanges = async (): Promise<GitLabMRChange[]> => {
    const mr = (await this.api.MergeRequests.changes(
      this.repoMetadata.repoSlug,
      this.repoMetadata.pullRequestID
    )) as GitLabMRChanges

    return mr.changes
  }

  getMergeRequestCommits = async (): Promise<GitLabMRCommit[]> => {
    return await this.api.MergeRequests.commits(this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID)
  }

  getMergeRequestNotes = async (): Promise<GitLabNote[]> => {
    const api = this.api.MergeRequestNotes
    return (await api.all(this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID)) as GitLabNote[]
  }

  getMergeRequestInlineNotes = async (): Promise<GitLabInlineNote[]> => {
    const res = await this.getMergeRequestNotes()

    const returns = res.filter((note: GitLabNote) => note.type == "DiffNote") as GitLabInlineNote[]

    return Promise.resolve(returns)
  }

  createMergeRequestDiscussion = async (content: string, position: GitLabDiscussionTextPosition): Promise<string> => {
    const api = this.api.MergeRequestDiscussions

    try {
      return await api.create(this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID, content, {
        position: position,
      })
    } catch (e) {
      console.error(`Error in createMergeRequestDiscussion: ${e}`)
      return Promise.reject(e)
    }
  }

  createMergeRequestNote = async (body: string): Promise<GitLabNote> => {
    const api = this.api.MergeRequestNotes

    try {
      return (await api.create(this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID, body)) as GitLabNote
    } catch (e) {
      console.error(`Error in createMergeRequestNote: ${e}`)
    }

    return Promise.reject()
  }

  updateMergeRequestNote = async (id: number, body: string): Promise<GitLabNote> => {
    const api = this.api.MergeRequestNotes

    try {
      return (await api.edit(this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID, id, body)) as GitLabNote
    } catch (e) {
      console.error(`Error in updateMergeRequestNote "${id}": ${e}`)
    }

    return Promise.reject()
  }

  // note: deleting the _only_ note in a discussion also deletes the discussion \o/
  deleteMergeRequestNote = async (id: number): Promise<boolean> => {
    const api = this.api.MergeRequestNotes

    try {
      await api.remove(this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID, id)
      return true
    } catch (e) {
      console.error(`Error in deleteMergeRequestNote "${id}": ${e}`)
    }

    return false
  }

  getFileContents = async (path: string, slug?: string, ref?: string): Promise<string> => {
    const api = this.api.RepositoryFiles
    const projectId = slug || this.repoMetadata.repoSlug
    // Use the current state of PR if no ref is passed
    if (!ref) {
      const mr: GitLabMR = await this.getMergeRequestInfo()
      ref = mr.diff_refs.head_sha
    }

    try {
      const response = await api.show(projectId, path, ref)
      return Buffer.from(response.content, "base64").toString()
    } catch (e) {
      // GitHubAPI.fileContents returns "" when the file does not exist, keep it consistent across providers
      if (e.response.status === 404) {
        return ""
      }
      throw e
    }
  }
}

export default GitLabAPI
