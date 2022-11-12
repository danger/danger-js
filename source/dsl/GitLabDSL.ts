// Please don't have includes in here that aren't inside the DSL folder, or the d.ts/flow defs break
// TODO: extract out from BitBucket specifically, or create our own type
import { Gitlab } from "@gitbeaker/node"
import { RepoMetaData } from "./BitBucketServerDSL"

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

export interface GitLabUser {
  id: number
  name: string
  username: string
  state: "active" | "blocked"
  avatar_url: string | null
  web_url: string
}

export interface GitLabUserProfile extends GitLabUser {
  created_at: string
  bio: string | null
  location: string | null
  public_email: string
  skype: string
  linkedin: string
  twitter: string
  website_url: string
  organization: string
  last_sign_in_at: string
  confirmed_at: string
  theme_id: number
  last_activity_on: string
  color_scheme_id: number
  projects_limit: number
  current_sign_in_at: string
  identities: [{ provider: string; extern_uid: string }]
  can_create_group: boolean
  can_create_project: boolean
  two_factor_enabled: boolean
  external: boolean
  private_profile: boolean
}

export interface GitLabMRBase {
  /** The MR's id */
  id: number

  /** The unique ID for this MR */
  iid: number

  /** The project ID for this MR */
  project_id: number

  /** The given name of the MR */
  title: string

  /** The body text describing the MR */
  description: string

  /** The MR's current availability */
  state: "closed" | "open" | "locked" | "merged"

  /** When was the MR made */
  created_at: string

  /** When was the MR updated */
  updated_at: string

  /** What branch is this MR being merged into */
  target_branch: string
  /** What branch is this MR come from */
  source_branch: string

  /** How many folks have given it an upvote */
  upvotes: number
  /** How many folks have given it an downvote */
  downvotes: number

  /** Who made it */
  author: GitLabUser
  /** Access rights for the user who created the MR */
  user: {
    /** Does the author have access to merge? */
    can_merge: boolean
  }
  /** Who was assigned as the person to review */
  assignee?: GitLabUser
  assignees: GitLabUser[]
  /** Users who were added as reviewers to the MR */
  reviewers: GitLabUser[]
  source_project_id: number
  target_project_id: number
  labels: string[]
  work_in_progress: boolean
  milestone: {
    id: number
    iid: number
    project_id: number
    title: string
    description: string
    state: "closed" | "active"
    created_at: string
    updated_at: string
    due_date: string
    start_date: string
    web_url: string
  }
  merge_when_pipeline_succeeds: boolean
  merge_status: "can_be_merged" // XXX: other statuses?
  merge_error: null | null
  sha: string
  merge_commit_sha: string | null
  user_notes_count: number
  discussion_locked: null | null
  should_remove_source_branch: boolean
  force_remove_source_branch: boolean
  allow_collaboration: boolean
  allow_maintainer_to_push: boolean
  web_url: string
  time_stats: {
    time_estimate: number
    total_time_spent: number
    human_time_estimate: number | null
    human_total_time_spent: number | null
  }
}

/** TODO: These need more comments from someone who uses GitLab, see GitLabDSL.ts in the danger-js repo */
export interface GitLabMR extends GitLabMRBase {
  squash: boolean
  subscribed: boolean
  changes_count: string
  merged_by: GitLabUser
  merged_at: string
  closed_by: GitLabUser | null
  closed_at: string | null
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
  approvals_before_merge: null | null
}

export interface GitLabMRChange {
  old_path: string
  new_path: string
  a_mode: string
  b_mode: string
  diff: string
  new_file: boolean
  renamed_file: boolean
  deleted_file: boolean
}

export interface GitLabMRChanges extends GitLabMRBase {
  changes: GitLabMRChange[]
}

export interface GitLabNote {
  id: number
  type: "DiffNote" | "DiscussionNote" | null // XXX: other types? null means "normal comment"
  body: string
  attachment: null // XXX: what can an attachment be?
  author: GitLabUser
  created_at: string
  updated_at: string
  system: boolean
  noteable_id: number
  noteable_type: "MergeRequest" // XXX: other types...?
  resolvable: boolean
  noteable_iid: number
}

export interface GitLabDiscussion {
  id: string; //40 character hex
  individual_note: boolean;
  notes: GitLabNote[];
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
