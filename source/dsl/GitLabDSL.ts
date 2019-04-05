export interface GitLabUser {
  id: number
  name: string
  username: string
  state: "active"
  avatar_url: string | null
  web_url: string
}

export interface GitLabMRDSLBase {
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
    state: "closed"
    created_at: string
    updated_at: string
    due_date: string
    start_date: string
    web_url: string
  }
  merge_when_pipeline_succeeds: boolean
  merge_status: "can_be_merged"
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

export interface GitLabMRDSL extends GitLabMRDSLBase {
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
    status: "success"
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

export interface GitLabMRChangeDSL {
  old_path: string
  new_path: string
  a_mode: string
  b_mode: string
  diff: string
  new_file: boolean
  renamed_file: boolean
  deleted_file: boolean
}

export interface GitLabMRChangesDSL extends GitLabMRDSLBase {
  changes: GitLabMRChangeDSL[]
}

export interface GitLabMRCommitDSL {
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
