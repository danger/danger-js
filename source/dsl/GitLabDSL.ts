// Please don't have includes in here that aren't inside the DSL folder, or the d.ts/flow defs break
// TODO: extract out from BitBucket specifically, or create our own type
import { Gitlab } from "@gitbeaker/node"
import { RepoMetaData } from "./BitBucketServerDSL"
// some imports can be used as is. we can remove them
import {
  MergeRequestSchema,
  UpdateMergeRequestOptions,
  MergeRequestLevelMergeRequestApprovalSchema,
  MergeRequestNoteSchema,
  BaseRequestOptions,
  UserExtendedSchema,
  RepositoryCompareSchema,
  CommitDiffSchema,
  CommitSchema,
} from "@gitbeaker/core/dist/types/types"
// ^ most of the imports can be used as is

// getPlatformReviewDSLRepresentation
export interface GitLabJSONDSL {
  /** Info about the repo */
  metadata: RepoMetaData
  /** Info about the merge request */
  mr: GitLabMR
  /** All of the individual commits in the merge request */
  commits: GitLabMRCommit[]
  /** Merge Request-level MR approvals Configuration */
  approvals: GitLabApproval
}

// danger.gitlab
/** The GitLab metadata for your MR */
export interface GitLabDSL extends GitLabJSONDSL {
  utils: {
    fileContents(path: string, repoSlug?: string, ref?: string): Promise<string>
  }
  api: InstanceType<typeof Gitlab>
}

// ---
// JSON responses from API

// can be removed
export interface GitLabUserProfile extends UserExtendedSchema {}
export interface GitlabUpdateMr extends UpdateMergeRequestOptions, BaseRequestOptions {}
export interface GitLabApproval extends MergeRequestLevelMergeRequestApprovalSchema {}
export interface GitLabMRChange extends CommitDiffSchema {}
export interface GitLabRepositoryCompare extends RepositoryCompareSchema {}
export interface GitLabMRCommit extends CommitSchema {}
// ^ can be removed

export interface GitLabInlineNote extends MergeRequestNoteSchema {
  type: "DiffNote" | "DiscussionNote" | null // XXX: other types? null means "normal comment"
}

/** TODO: These need more comments from someone who uses GitLab, see GitLabDSL.ts in the danger-js repo */
export interface GitLabMR extends MergeRequestSchema {
  subscribed: boolean
  changes_count: string
  latest_build_started_at: string
  latest_build_finished_at: string
  first_deployed_to_production_at: string | null
  pipeline: {
    id: number
    sha: string
    ref: string
    status: "canceled" | "failed" | "pending" | "running" | "skipped" | "success"
    web_url: string
  }
  diff_refs: {
    base_sha: string
    head_sha: string
    start_sha: string
  }
  diverged_commits_count: number
  rebase_in_progress: boolean
  approvals_before_merge: null
  //
  /** Access rights for the user who created the MR */
  user: {
    /** Does the author have access to merge? */
    can_merge: boolean
  }
  merge_error: null
  allow_collaboration: boolean
  allow_maintainer_to_push: boolean
}

export interface GitLabMRChanges extends MergeRequestSchema {
  /** Access rights for the user who created the MR */
  user: {
    /** Does the author have access to merge? */
    can_merge: boolean
  }
  merge_error: null
  allow_collaboration: boolean
  allow_maintainer_to_push: boolean
}

export interface GitLabNote extends MergeRequestNoteSchema {
  type: "DiffNote" | "DiscussionNote" | null // XXX: other types? null means "normal comment"
}

export interface GitLabDiscussionTextPosition {
  position_type: "text"
  base_sha: string
  start_sha: string
  head_sha: string
  new_path: string
  new_line: number
  old_path: string
  old_line: number | null
}
