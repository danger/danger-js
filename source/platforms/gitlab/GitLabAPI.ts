import { RepoMetaData } from "../../dsl/BitBucketServerDSL"
import { api as fetch } from "../../api/fetch"
import {
  GitLabMR,
  GitLabMRChanges,
  GitLabMRChange,
  GitLabMRCommit,
  GitLabUserProfile,
  GitLabInlineNote,
  GitLabNote,
} from "../../dsl/GitLabDSL"

import { Gitlab } from "gitlab"
// const Gitlab = require("gitlab").default

export type GitLabAPIToken = string

class GitLabAPI {
  fetch: typeof fetch

  // private mr: GitLabMR | undefined
  // private user: GitLabUserProfile | undefined

  // https://github.com/jdalrymple/node-gitlab/issues/257
  private api: any //typeof Gitlab

  constructor(public readonly repoMetadata: RepoMetaData, public readonly token: GitLabAPIToken) {
    // This allows Peril to DI in a new Fetch function
    // which can handle unique API edge-cases around integrations
    this.fetch = fetch

    // Type 'Mapper<typeof import("/Users/joshua/dev/ext/danger-js/node_modules/gitlab/dist/services/index"), "Groups" | "GroupAccessRequests" | "GroupBadges" | "GroupCustomAttributes" | "GroupIssueBoards" | ... 77 more ... | "Wikis">' is not assignable to type
    //      'Bundle<typeof import("/Users/joshua/dev/ext/danger-js/node_modules/gitlab/dist/services/index"), "Groups" | "GroupAccessRequests" | "GroupBadges" | "GroupCustomAttributes" | "GroupIssueBoards" | ... 77 more ... | "Wikis">'.
    // Type                 'Mapper<typeof import("/Users/joshua/dev/ext/danger-js/node_modules/gitlab/dist/services/index"), "Groups" | "GroupAccessRequests" | "GroupBadges" | "GroupCustomAttributes" | "GroupIssueBoards" | ... 77 more ... | "Wikis">' provides no match for the signature
    // 'new (options?: any): Mapper<typeof import("/Users/joshua/dev/ext/danger-js/node_modules/gitlab/dist/services/index"), "Groups" | "GroupAccessRequests" | "GroupBadges" | "GroupCustomAttributes" | ... 78 more ... | "Wikis">'.ts(2322)

    const api = new Gitlab({
      host: this.hostURL,
      token,
    })

    this.api = api
  }

  get hostURL(): string {
    return `https://${process.env["DANGER_GITLAB_HOST"]}`
  }

  get projectURL(): string {
    return `${this.hostURL}/${this.repoMetadata.repoSlug}`
  }

  get mergeRequestURL(): string {
    return `${this.projectURL}/merge_requests/${this.repoMetadata.pullRequestID}`
  }

  getUser = async (): Promise<GitLabUserProfile> => {
    // if (this.user) {
    //   return this.user
    // }

    const user = (await this.api.Users.current()) as GitLabUserProfile

    // this.user = user

    return user
  }

  getMergeRequestInfo = async (): Promise<GitLabMR> => {
    // if (this.mr) {
    //   return this.mr
    // }

    const mr = (await this.api.MergeRequests.show(
      this.repoMetadata.repoSlug,
      this.repoMetadata.pullRequestID
    )) as GitLabMR

    // this.mr = mr

    return mr

    // const repo = this.repoMetadata.repoSlug
    // const prID = this.repoMetadata.pullRequestID
    // const res = await this.get(`repos/${repo}/pulls/${prID}`)
    // const prDSL = (await res.json()) as GitLabMRDSL
    // this.pr = prDSL

    // if (res.ok) {
    //   return prDSL
    // } else {
    //   throw `Could not get PR Metadata for repos/${repo}/pulls/${prID}`
    // }
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
    const api = this.api.MergeRequestNotes
    const res = await api.all(this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID)

    const returns = res.filter((note: GitLabNote) => note.type == "DiffNote") as GitLabInlineNote[]

    return Promise.resolve(returns)
  }

  createMergeRequestDiscussion = async (content: string): Promise<string> => {
    const api = this.api.MergeRequestDiscussions

    try {
      const res = await api.create(this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID, content, {
        position: {
          position_type: "text",
          base_sha: "7ff257811bbd6eb14bb6a3d3ceee0006b431d6dd",
          start_sha: "7ff257811bbd6eb14bb6a3d3ceee0006b431d6dd",
          head_sha: "1a3f30ca1a64c558a98c43ea1201a43423b4c520",
          new_line: "4",
          new_path: "file2",
        },
      })

      console.log({ res })

      return res
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
