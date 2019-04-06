// TODO: extract out from BitBucket specifically, or create our own type
import { RepoMetaData } from "./BitBucketServerDSL"

// danger.gitlab

export interface GitLabDSL {
  metadata: RepoMetaData
  // issues: any[]
  mr: GitLabMR
  commits: GitLabMRCommit[]
  // comments: any[]
  utils: {}
}

// ---
// JSON responses from API

export interface GitLabUser {
  id: number
  name: string
  username: string
  state: "active" // XXX: other states?
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
  /**  */
  id: number

  /**  */
  iid: number

  /**  */
  project_id: number

  /**  */
  title: string

  /**  */
  description: string

  /**  */
  state: "closed" | "open" | "locked" | "merged"

  /**  */
  created_at: string

  /**  */
  updated_at: string

  target_branch: string
  source_branch: string
  upvotes: number
  downvotes: number

  author: GitLabUser
  user: {
    can_merge: boolean
  }
  assignee: GitLabUser
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
    state: "closed" // XXX: other states?
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
    status: "success" // XXX: other statuses?
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
