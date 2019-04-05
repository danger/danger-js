import { RepoMetaData } from "../../dsl/BitBucketServerDSL"
import { api as fetch } from "../../api/fetch"
import { GitLabMRDSL, GitLabMRChangesDSL, GitLabMRChangeDSL, GitLabMRCommitDSL } from "../../dsl/GitLabDSL"

import { Gitlab } from "gitlab"
// const Gitlab = require("gitlab").default

export type GitLabAPIToken = string

class GitLabAPI {
  fetch: typeof fetch

  private pr: GitLabMRDSL | undefined

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

  getPullRequestInfo = async (): Promise<GitLabMRDSL> => {
    if (this.pr) {
      return this.pr
    }

    console.log("[+] getPullRequestInfo")

    return this.api.MergeRequests.show(this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID)

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

  getMergeRequestChanges = async (): Promise<GitLabMRChangeDSL[]> => {
    const pr: GitLabMRChangesDSL = await this.api.MergeRequests.changes(
      this.repoMetadata.repoSlug,
      this.repoMetadata.pullRequestID
    )

    return pr.changes
  }

  getMergeRequestCommits = async (): Promise<GitLabMRCommitDSL[]> => {
    return this.api.MergeRequests.commits(this.repoMetadata.repoSlug, this.repoMetadata.pullRequestID)
  }
}

export default GitLabAPI
