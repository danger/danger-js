// Please don't have includes in here that aren't inside the DSL folder, or the d.ts/flow defs break
import type * as Types from "@gitbeaker/rest"
import { RepoMetaData } from "./RepoMetaData"

// getPlatformReviewDSLRepresentation
export interface GitLabJSONDSL {
  /** Info about the repo */
  metadata: RepoMetaData
  /** Info about the merge request */
  mr: Types.ExpandedMergeRequestSchema
  /** All the individual commits in the merge request */
  commits: Types.CommitSchema[]
  /** Merge Request-level MR approvals Configuration */
  approvals: Types.MergeRequestLevelMergeRequestApprovalSchema
}

// danger.gitlab
/** The GitLab metadata for your MR */
export interface GitLabDSL extends GitLabJSONDSL {
  utils: {
    fileContents(path: string, repoSlug?: string, ref?: string): Promise<string>
    addLabels(...labels: string[]): Promise<boolean>
    removeLabels(...labels: string[]): Promise<boolean>
  }
  api: InstanceType<typeof Types.Gitlab>
}
