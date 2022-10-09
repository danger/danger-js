// Please don't have includes in here that aren't inside the DSL folder, or the d.ts/flow defs break
import { Gitlab, Types } from "@gitbeaker/node"
import { RepoMetaData } from "./RepoMetaData"

// getPlatformReviewDSLRepresentation
export interface GitLabJSONDSL {
  /** Info about the repo */
  metadata: RepoMetaData
  /** Info about the merge request */
  mr: GitLabMR
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
  api: InstanceType<typeof Gitlab>
}

// ---
// JSON responses from API
export interface GitlabUpdateMr extends Types.UpdateMergeRequestOptions, Types.BaseRequestOptions {}

export interface GitLabNote extends Types.MergeRequestNoteSchema {
  type: "DiffNote" | "DiscussionNote" | null // XXX: other types? null means "normal comment"
}

export interface GitLabInlineNote extends GitLabNote {
  type: "DiffNote" | "DiscussionNote" | null // XXX: other types? null means "normal comment"
}

/** TODO: These need more comments from someone who uses GitLab, see GitLabDSL.ts in the danger-js repo */
export interface GitLabMR extends Types.MergeRequestSchema {
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

export interface GitLabDiscussion {
  id: string //40 character hex
  individual_note: boolean
  notes: GitLabNote[]
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

export interface GitLabDiscussionCreationOptions {
  position?: GitLabDiscussionTextPosition
}

export interface GitLabInlineNote extends GitLabNote {
  position: {
    base_sha: string
    start_sha: string
    head_sha: string
    old_path: string
    new_path: string
    position_type: "text" // XXX: other types?
    old_line: number | null
    new_line: number
  }
  resolvable: boolean
  resolved: boolean
  resolved_by: GitLabUser | null
}

export interface GitLabMRCommit {
  id: string
  short_id: string
  created_at: string
  parent_ids: string[]
  title: string
  message: string
  author_name: string
  author_email: string
  authored_date: string
  committer_name: string
  committer_email: string
  committed_date: string
}

export interface GitLabCommit {
  id: string
  short_id: string
  title: string
  author_name: string
  author_email: string
  created_at: string
}

export interface GitLabRepositoryCompare {
  commit: GitLabCommit
  commits: GitLabCommit[]
  diffs: GitLabMRChange[]
  compare_timeout: boolean
  compare_same_ref: boolean
}

export interface GitLabApproval {
  id: number
  iid: number
  project_id: number
  title: string
  description: string
  state: "closed" | "open" | "locked" | "merged"
  created_at: string
  updated_at: string
  merge_status: "can_be_merged"
  approvals_required: number
  approvals_left: number
  approved_by?:
    | {
        user: GitLabUser
      }[]
    | GitLabUser[]
}
