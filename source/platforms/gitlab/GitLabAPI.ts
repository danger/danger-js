import { RepoMetaData } from "../../dsl/RepoMetaData"
import { Gitlab, Types } from "@gitbeaker/node"
import { Types as CoreTypes } from "@gitbeaker/core/dist"
import { Env } from "../../ci_source/ci_source"
import { debug } from "../../debug"
import { encodingParser } from "../encodingParser"

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
    // GitLab >= v11.7 supplies the API Endpoint in an environment variable, and we can work out our host value from
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

  getUser = async (): Promise<Types.UserExtendedSchema> => {
    this.d("getUser")
    // https://github.com/jdalrymple/gitbeaker/issues/2084
    const user = (await this.api.Users.current()) as Types.UserExtendedSchema
    this.d("getUser", user)
    return user
  }

  getMergeRequestInfo = async (): Promise<CoreTypes.ExpandedMergeRequestSchema> => {
    this.d(`getMergeRequestInfo for repo: ${this.repoSlug} pr: ${this.prId}`)
    const mr = await this.api.MergeRequests.show(this.repoSlug, this.prId)
    this.d("getMergeRequestInfo", mr)
    return mr as CoreTypes.ExpandedMergeRequestSchema
  }

  updateMergeRequestInfo = async (
    changes: Types.UpdateMergeRequestOptions & Types.BaseRequestOptions
  ): Promise<Types.MergeRequestSchema> => {
    const mr = this.api.MergeRequests.edit(this.repoSlug, this.prId, changes)
    this.d("updateMergeRequestInfo", mr)
    return mr
  }

  getMergeRequestApprovals = async (): Promise<Types.MergeRequestLevelMergeRequestApprovalSchema> => {
    this.d(`getMergeRequestApprovals for repo: ${this.repoSlug} pr: ${this.prId}`)
    const approvals = await this.api.MergeRequestApprovals.configuration(this.repoSlug, {
      mergerequestIid: this.prId,
    })
    this.d("getMergeRequestApprovals", approvals)
    return approvals
  }

  getMergeRequestChanges = async (): Promise<Types.CommitDiffSchema[]> => {
    this.d(`getMergeRequestChanges for repo: ${this.repoSlug} pr: ${this.prId}`)
    const mr = await this.api.MergeRequests.changes(this.repoSlug, this.prId)
    this.d("getMergeRequestChanges", mr.changes)
    return mr.changes as Types.CommitDiffSchema[]
  }

  getMergeRequestCommits = async (): Promise<Types.CommitSchema[]> => {
    this.d("getMergeRequestCommits", this.repoSlug, this.prId)
    const commits = await this.api.MergeRequests.commits(this.repoSlug, this.prId)
    this.d("getMergeRequestCommits", commits)
    return commits
  }

  getMergeRequestDiscussions = async (): Promise<Types.DiscussionSchema[]> => {
    this.d("getMergeRequestDiscussions", this.repoSlug, this.prId)
    const api = this.api.MergeRequestDiscussions
    const discussions = await api.all(this.repoSlug, this.prId, {})
    this.d("getMergeRequestDiscussions", discussions)
    return discussions
  }

  getMergeRequestNotes = async (): Promise<Types.MergeRequestNoteSchema[]> => {
    this.d("getMergeRequestNotes", this.repoSlug, this.prId)
    const api = this.api.MergeRequestNotes
    const notes = await api.all(this.repoSlug, this.prId, {})
    this.d("getMergeRequestNotes", notes)
    return notes
  }

  getMergeRequestInlineNotes = async (): Promise<Types.MergeRequestNoteSchema[]> => {
    this.d("getMergeRequestInlineNotes")
    const notes = await this.getMergeRequestNotes()
    const inlineNotes = notes.filter((note) => note.type == "DiffNote")
    this.d("getMergeRequestInlineNotes", inlineNotes)
    return inlineNotes
  }

  createMergeRequestDiscussion = async (
    content: string,
    options?: {
      position?: Partial<Types.DiscussionNotePosition>
    } & Types.BaseRequestOptions
  ): Promise<Types.DiscussionSchema> => {
    this.d("createMergeRequestDiscussion", this.repoSlug, this.prId, content, options)
    const api = this.api.MergeRequestDiscussions
    try {
      const result = await api.create(this.repoSlug, this.prId, content, options)
      this.d("createMergeRequestDiscussion", result)
      return result
    } catch (e) {
      this.d("createMergeRequestDiscussion", e)
      throw e
    }
  }

  createMergeRequestNote = async (body: string): Promise<Types.DiscussionNote> => {
    this.d("createMergeRequestNote", this.repoSlug, this.prId, body)
    try {
      this.d("createMergeRequestNote")
      const note = await this.api.MergeRequestNotes.create(this.repoSlug, this.prId, body)
      this.d("createMergeRequestNote", note)
      return note
    } catch (e) {
      this.d("createMergeRequestNote", e)
    }

    return Promise.reject()
  }

  updateMergeRequestNote = async (id: number, body: string): Promise<Types.DiscussionNote> => {
    this.d("updateMergeRequestNote", this.repoSlug, this.prId, id, body)
    try {
      const note = await this.api.MergeRequestNotes.edit(this.repoSlug, this.prId, id, body)
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
      const mr = await this.getMergeRequestInfo()
      ref = mr.diff_refs.head_sha
    }

    try {
      this.d("getFileContents", projectId, path, ref)
      const response = await api.show(projectId, path, ref)
      const encoding = encodingParser(response.encoding)
      const result: string = Buffer.from(response.content, encoding).toString()
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

  getCompareChanges = async (base?: string, head?: string): Promise<Types.CommitDiffSchema[]> => {
    if (!base || !head) {
      return this.getMergeRequestChanges()
    }
    const api = this.api.Repositories
    const projectId = this.repoSlug
    const compare = await api.compare(projectId, base, head)
    return compare.diffs ? compare.diffs : []
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
