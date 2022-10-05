import { Gitlab } from "@gitbeaker/node"

import { RepoMetaData } from "../../dsl/BitBucketServerDSL"
import { api as fetch } from "../../api/fetch"
import {
  GitLabApproval,
  GitLabMR,
  GitLabMRChange,
  GitLabMRChanges,
  GitLabMRCommit,
  GitLabNote,
  GitLabRepositoryCompare,
  GitlabUpdateMr,
  GitLabUserProfile,
  GitLabDiscussionTextPosition,
} from "../../dsl/GitLabDSL"
import { Env } from "../../ci_source/ci_source"
import { debug } from "../../debug"
import { RepositoryFileExtendedSchema } from "@gitbeaker/core/dist/types/resources/RepositoryFiles"

export type GitLabAPIToken = string
export type GitLabOAuthToken = string
export interface GitLabAPICredentials {
  host: string
  token?: GitLabAPIToken
  oauthToken?: GitLabOAuthToken
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
    // GitLab >= v11.7 supplies the API Endpoint in an environment variable, and we can work out our host value from that.
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
    oauthToken: env["DANGER_GITLAB_API_OAUTH_TOKEN"],
  }
}

class GitLabAPI {
  fetch: typeof fetch
  private readonly api: InstanceType<typeof Gitlab>
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

  get apiInstance() {
    return this.api
  }

  getUser = async (): Promise<GitLabUserProfile> => {
    this.d("getUser")
    const user = (await this.api.Users.current()) as GitLabUserProfile
    this.d("getUser", user)
    return user
  }

  getMergeRequestInfo = async (): Promise<GitLabMR> => {
    this.d(`getMergeRequestInfo for repo: ${this.repoMetadata.repoSlug} pr: ${this.repoMetadata.pullRequestID}`)
    const mr = (await this.api.MergeRequests.show(
      this.repoMetadata.repoSlug,
      Number(this.repoMetadata.pullRequestID)
    )) as GitLabMR
    this.d("getMergeRequestInfo", mr)
    return mr
  }

  updateMergeRequestInfo = async (changes: GitlabUpdateMr): Promise<object> => {
    const mr = this.api.MergeRequests.edit(this.repoMetadata.repoSlug, Number(this.repoMetadata.pullRequestID), changes)
    this.d("updateMergeRequestInfo", mr)
    return mr
  }

  getMergeRequestApprovals = async (): Promise<GitLabApproval> => {
    this.d(`getMergeRequestApprovals for repo: ${this.repoMetadata.repoSlug} pr: ${this.repoMetadata.pullRequestID}`)
    const approvals = (await this.api.MergeRequestApprovals.configuration(this.repoMetadata.repoSlug, {
      mergerequestIid: Number(this.repoMetadata.pullRequestID),
    })) as GitLabApproval
    this.d("getMergeRequestApprovals", approvals)
    return approvals
  }

  getMergeRequestChanges = async (): Promise<GitLabMRChange[]> => {
    this.d(`getMergeRequestChanges for repo: ${this.repoMetadata.repoSlug} pr: ${this.repoMetadata.pullRequestID}`)
    const mr = (await this.api.MergeRequests.changes(
      this.repoMetadata.repoSlug,
      Number(this.repoMetadata.pullRequestID)
    )) as GitLabMRChanges
    this.d("getMergeRequestChanges", mr.changes)
    return mr.changes as GitLabMRChange[]
  }

  getMergeRequestCommits = async (): Promise<GitLabMRCommit[]> => {
    this.d("getMergeRequestCommits", this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID)
    const commits = (await this.api.MergeRequests.commits(
      this.repoMetadata.repoSlug,
      Number(this.repoMetadata.pullRequestID)
    )) as GitLabMRCommit[]
    this.d("getMergeRequestCommits", commits)
    return commits
  }
  //
  getMergeRequestNotes = async (): Promise<GitLabNote[]> => {
    this.d("getMergeRequestNotes", this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID)
    const notes = (await this.api.MergeRequestNotes.all(
      this.repoMetadata.repoSlug,
      this.repoMetadata.pullRequestID,
      {}
    )) as GitLabNote[]
    this.d("getMergeRequestNotes", notes)
    return notes
  }

  getMergeRequestInlineNotes = async (): Promise<GitLabNote[]> => {
    this.d("getMergeRequestInlineNotes")
    const notes: GitLabNote[] = await this.getMergeRequestNotes()
    const inlineNotes = notes.filter((note: GitLabNote) => note.type == "DiffNote") as GitLabNote[]
    this.d("getMergeRequestInlineNotes", inlineNotes)
    return inlineNotes
  }
  // TODO: test
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
      const result = await api.create(this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID, content, {
        position: position,
      })
      this.d("createMergeRequestDiscussion", result)
      return result as unknown as string // not sure why?
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
      const note = (await api.create(this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID, body)) as GitLabNote
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
      const note = (await api.edit(this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID, id, body)) as GitLabNote
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
    const projectId = slug || this.repoMetadata.repoSlug
    // Use the current state of PR if no ref is passed
    if (!ref) {
      const mr: GitLabMR = await this.getMergeRequestInfo()
      ref = mr.diff_refs.head_sha
    }

    try {
      this.d("getFileContents", projectId, path, ref)
      const response = (await this.api.RepositoryFiles.show(projectId, path, ref)) as RepositoryFileExtendedSchema
      const result: string = Buffer.from(response.content, response.encoding).toString()
      this.d("getFileContents", result)
      return result
    } catch (e) {
      this.d("getFileContents", e)
      // GitHubAPI.fileContents returns "" when the file does not exist, keep it consistent across providers
      if ((e as any).response.statusCode === 404) {
        return ""
      }
      throw e
    }
  }

  getCompareChanges = async (base?: string, head?: string): Promise<GitLabMRChange[] | undefined> => {
    if (!base || !head) {
      return this.getMergeRequestChanges()
    }
    const projectId = this.repoMetadata.repoSlug
    const compare = (await this.api.Repositories.compare(projectId, base, head)) as GitLabRepositoryCompare
    return compare.diffs
  }
  // TODO: test
  addLabels = async (...labels: string[]): Promise<boolean> => {
    const mr = await this.getMergeRequestInfo()
    mr.labels?.push(...labels)
    await this.updateMergeRequestInfo({ labels: mr.labels?.join(",") })
    return true
  }

  removeLabels = async (...labels: string[]): Promise<boolean> => {
    const mr = await this.getMergeRequestInfo()

    for (const label of labels) {
      const index = mr.labels?.indexOf(label)
      if ((index as number) > -1) {
        mr.labels?.splice(index as number, 1)
      }
    }
    await this.updateMergeRequestInfo({ labels: mr.labels?.join(",") })
    return true
  }
}

export default GitLabAPI
