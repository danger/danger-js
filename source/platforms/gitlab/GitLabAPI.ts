import { RepoMetaData } from "../../dsl/BitBucketServerDSL"
import {
  GitLabApproval,
  GitLabDiscussion,
  GitLabDiscussionCreationOptions,
  GitLabInlineNote,
  GitLabMR,
  GitLabMRChange,
  GitLabMRChanges,
  GitLabMRCommit,
  GitLabNote,
  GitLabRepositoryCompare,
  GitLabUserProfile,
} from "../../dsl/GitLabDSL"
import { Gitlab } from "@gitbeaker/node"
import { RepositoryFileSchema } from "@gitbeaker/core/dist/types/services/RepositoryFiles"
import { Env } from "../../ci_source/ci_source"
import { debug } from "../../debug"

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
    // GitLab >= v11.7 supplies the API Endpoint in an environment variable and we can work out our host value from
    // that. See https://docs.gitlab.com/ce/ci/variables/predefined_variables.html
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
  private readonly api: InstanceType<typeof Gitlab>
  private readonly hostURL: string
  private readonly d = debug("GitLabAPI")
  private readonly repoSlug: string
  private readonly prId: number

  constructor(public readonly repoMetadata: RepoMetaData, public readonly repoCredentials: GitLabAPICredentials) {
    this.api = new Gitlab(repoCredentials)
    this.hostURL = repoCredentials.host
    this.repoSlug = repoMetadata.repoSlug
    this.prId = Number(repoMetadata.pullRequestID)
  }

  get projectURL(): string {
    return `${this.hostURL}/${this.repoSlug}`
  }

  get mergeRequestURL(): string {
    return `${this.projectURL}/merge_requests/${this.prId}`
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
    this.d(`getMergeRequestInfo for repo: ${this.repoSlug} pr: ${this.prId}`)
    const mr = (await this.api.MergeRequests.show(this.repoSlug, this.prId)) as GitLabMR
    this.d("getMergeRequestInfo", mr)
    return mr
  }

  updateMergeRequestInfo = async (changes: object): Promise<object> => {
    const mr = this.api.MergeRequests.edit(this.repoSlug, this.prId, changes)
    this.d("updateMergeRequestInfo", mr)
    return mr
  }

  getMergeRequestApprovals = async (): Promise<GitLabApproval> => {
    this.d(`getMergeRequestApprovals for repo: ${this.repoSlug} pr: ${this.prId}`)
    const approvals = (await this.api.MergeRequests.approvals(this.repoSlug, {
      mergerequestIid: this.prId,
    })) as GitLabApproval
    this.d("getMergeRequestApprovals", approvals)
    return approvals
  }

  getMergeRequestChanges = async (): Promise<GitLabMRChange[]> => {
    this.d(`getMergeRequestChanges for repo: ${this.repoSlug} pr: ${this.prId}`)
    const mr = (await this.api.MergeRequests.changes(this.repoSlug, this.prId)) as GitLabMRChanges
    this.d("getMergeRequestChanges", mr.changes)
    return mr.changes
  }

  getMergeRequestCommits = async (): Promise<GitLabMRCommit[]> => {
    this.d("getMergeRequestCommits", this.repoSlug, this.prId)
    const commits = (await this.api.MergeRequests.commits(this.repoSlug, this.prId)) as GitLabMRCommit[]
    this.d("getMergeRequestCommits", commits)
    return commits
  }

  getMergeRequestDiscussions = async (): Promise<GitLabDiscussion[]> => {
    this.d("getMergeRequestDiscussions", this.repoSlug, this.prId)
    const api = this.api.MergeRequestDiscussions
    const discussions = (await api.all(this.repoSlug, this.prId, {})) as GitLabDiscussion[]
    this.d("getMergeRequestDiscussions", discussions)
    return discussions
  }

  getMergeRequestNotes = async (): Promise<GitLabNote[]> => {
    this.d("getMergeRequestNotes", this.repoSlug, this.prId)
    const api = this.api.MergeRequestNotes
    const notes = (await api.all(this.repoSlug, this.prId, {})) as GitLabNote[]
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

  createMergeRequestDiscussion = async (
    content: string,
    options?: GitLabDiscussionCreationOptions,
  ): Promise<GitLabDiscussion> => {
    this.d("createMergeRequestDiscussion", this.repoSlug, this.prId, content, options)
    const api = this.api.MergeRequestDiscussions
    try {
      const result = await api.create(this.repoSlug, this.prId, content, options) as GitLabDiscussion
      this.d("createMergeRequestDiscussion", result)
      return result
    } catch (e) {
      this.d("createMergeRequestDiscussion", e)
      throw e
    }
  }

  createMergeRequestNote = async (body: string): Promise<GitLabNote> => {
    this.d("createMergeRequestNote", this.repoSlug, this.prId, body)
    try {
      this.d("createMergeRequestNote")
      const note = (await this.api.MergeRequestNotes.create(this.repoSlug, this.prId, body)) as GitLabNote
      this.d("createMergeRequestNote", note)
      return note
    } catch (e) {
      this.d("createMergeRequestNote", e)
    }

    return Promise.reject()
  }

  updateMergeRequestNote = async (id: number, body: string): Promise<GitLabNote> => {
    this.d("updateMergeRequestNote", this.repoSlug, this.prId, id, body)
    try {
      const note = (await this.api.MergeRequestNotes.edit(this.repoSlug, this.prId, id, body)) as GitLabNote
      this.d("updateMergeRequestNote", note)
      return note
    } catch (e) {
      this.d("updateMergeRequestNote", e)
    }

    return Promise.reject()
  }

  // note: deleting the _only_ note in a discussion also deletes the discussion \o/
  deleteMergeRequestNote = async (id: number): Promise<boolean> => {
    this.d("deleteMergeRequestNote", this.repoSlug, this.prId, id)
    try {
      await this.api.MergeRequestNotes.remove(this.repoSlug, this.prId, id)
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
    const projectId = slug || this.repoSlug
    // Use the current state of PR if no ref is passed
    if (!ref) {
      const mr: GitLabMR = await this.getMergeRequestInfo()
      ref = mr.diff_refs.head_sha
    }

    try {
      this.d("getFileContents", projectId, path, ref)
      const response = (await api.show(projectId, path, ref)) as RepositoryFileSchema
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

  getCompareChanges = async (base?: string, head?: string): Promise<GitLabMRChange[]> => {
    if (!base || !head) {
      return this.getMergeRequestChanges()
    }
    const api = this.api.Repositories
    const projectId = this.repoSlug
    const compare = (await api.compare(projectId, base, head)) as GitLabRepositoryCompare
    return compare.diffs
  }

  addLabels = async (...labels: string[]): Promise<boolean> => {
    const mr = await this.getMergeRequestInfo()
    const noDuplicates = new Set([...(mr.labels as string[]), ...labels])
    await this.updateMergeRequestInfo({ labels: Array.from(noDuplicates).join(",") })
    return true
  }

  removeLabels = async (...labels: string[]): Promise<boolean> => {
    const mr = await this.getMergeRequestInfo()

    for (const label of labels) {
      const index = mr.labels.indexOf(label)
      if (index > -1) {
        mr.labels.splice(index, 1)
      }
    }

    await this.updateMergeRequestInfo({ labels: mr.labels.join(",") })

    return true
  }
}

export default GitLabAPI
