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
  return {
    host: `https://${env["DANGER_GITLAB_HOST"]}`,
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
}

export default GitLabAPI
