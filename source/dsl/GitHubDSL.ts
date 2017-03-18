import { GitCommit } from "./Commit"

// This is `danger.github`

/** The GitHub metadata for your PR */
export interface GitHubDSL {
  /** The issue metadata for a code review session */
  issue: GitHubIssue,
  /** The PR metadata for a code review session */
  pr: GitHubPRDSL,
  /** The github commit metadata for a code review session */
  commits: Array<GitHubCommit>
  /** The reviews left on this pull request */
  reviews: Array<GitHubReview>
  /** The people requested to review this PR */
  requested_reviewers: Array<GitHubUser>
  /** A scope for useful functions related to GitHub */
  utils: GitHubUtilsDSL
}

/** Useful functions for GitHub related work */
export interface GitHubUtilsDSL {
  /**
   * Creates HTML for a sentence of clickable links for an array of paths.
   * This uses the source of the PR as the target, not the destination repo.
   * You can manually set the target repo and branch however, to make it work how you want.
   *
   * @param {string} paths A list of strings representing file paths
   * @param {string} useBasename Show either the file name, or the full path - defaults to just file name e.g. true.
   * @param {string} repoSlug An optional override for the repo slug, ex: "orta/ORStackView"
   * @param {string} branch An optional override for the branch, ex: "v3"
   * @returns {string} A HTML string of <a>'s built as a sentence.
   */
  fileLinks(paths: string[], useBasename?: boolean, repoSlug?: string, branch?: string): string
}

/**
 * This is `danger.github.issue`
 * It refers to the issue that makes up the Pull Request
 * GitHub treats all pull requests as a special type of issue
 * This DSL contains only parts of the issue that are not found in the PR DSL
 * A GitHub Issue
 */
export interface GitHubIssue {
  /**
   * The labels associated with this issue
   * @type {Array<GitHubIssueLabel>}
   */

  labels: Array<GitHubIssueLabel>
}

// Subtypes specific to issues

export interface GitHubIssueLabel {
  /**
   * The identifying number of this label
   * @type {number}
   * @memberOf GitHubIssueLabel
   */
  id: number,

  /**
   * The URL that links to this label
   * @type {string}
   * @memberOf GitHubIssueLabel
   */
  url: string,

  /**
   * The name of the label
   * @type {string}
   * @memberOf GitHubIssueLabel
   */
  name: string,

  /**
   * The color associated with this label
   * @type {string}
   * @memberOf GitHubIssueLabel
   */
  color: string
}

// This is `danger.github.pr`

/** What a PR's JSON looks like */
export interface GitHubPRDSL {
  /**
   * The UUID for the PR
   * @type {number}
   */
  number: number

  /**
   * The state for the PR
   * @type {string}
   */
  state: "closed" | "open" | "locked" | "merged"

  /**
   * Has the PR been locked to contributors only?
   * @type {boolean}
   */
  locked: boolean

  /**
   * The title of the PR
   * @type {string}
   */
  title: string

  /**
   * The markdown body message of the PR
   * @type {string}
   */
  body: string

  /**
   * ISO6801 Date string for when PR was created
   * @type {string}
   */
  created_at: string

  /**
   * ISO6801 Date string for when PR was updated
   * @type {string}
   */
  updated_at: string

  /**
   * optional ISO6801 Date string for when PR was closed
   * @type {string}
   */
  closed_at: string | null

  /**
   * Optional ISO6801 Date string for when PR was merged.
   * Danger probably shouldn't be running in this state.
   * @type {string}
   */
  merged_at: string | null

  /**
   * Merge reference for the _other_ repo.
   * @type {GitHubMergeRef}
   */
  head: GitHubMergeRef

  /**
   * Merge reference for _this_ repo.
   * @type {GitHubMergeRef}
   */
  base: GitHubMergeRef

  /**
   * The User who submitted the PR
   * @type {GitHubUser}
   */
  user: GitHubUser

  /**
   * The User who is assigned the PR
   * @type {GitHubUser}
   */
  assignee: GitHubUser

  /**
   * The Users who are assigned to the PR
   * @type {GitHubUser}
   */
  assignees: Array<GitHubUser>

  /**
   * Has the PR been merged yet
   * @type {boolean}
   */
  merged: boolean

  /**
   * The number of comments on the PR
   * @type {number}
   */
  comments: number

  /**
   * The number of review-specific comments on the PR
   * @type {number}
   */
  review_comments: number

  /**
   * The number of commits in the PR
   * @type {number}
   */
  commits: number

  /**
   * The number of additional lines in the PR
   * @type {number}
   */
  additions: number

  /**
   * The number of deleted lines in the PR
   * @type {number}
   */
  deletions: number

  /**
   * The number of changed files in the PR
   * @type {number}
   */
  changed_files: number
}

// These are the individual subtypes of objects inside the larger DSL objects above.

/** A GitHub specific implmentation of a git commit */
export interface GitHubCommit {
  /** The raw commit metadata */
  commit: GitCommit,
  /** The SHA for the commit */
  sha: string,
  /** the url for the commit on GitHub */
  url: string,
  /** The GitHub user who wrote the code */
  author: GitHubUser,
  /** The GitHub user who shipped the code */
  committer: GitHubUser,
  /** An array of parent commit shas */
  parents: Array<any>
}

/**
 * A GitHub user account
 */
export interface GitHubUser {
  /**
   * Generic UUID
   * @type {number}
   */
  id: number
  /**
   * The handle for the user/org
   * @type {string}
   */
  login: string
  /**
   * Whether the user is an org, or a user
   * @type {string}
   */
  type: "User" | "Organization"
}

/**
 * A GitHub Repo
 */
export interface GitHubRepo {
  /**
   * Generic UUID
   * @type {number}
   */
  id: number

  /**
   * The name of the repo, e.g. "Danger-JS"
   * @type {string}
   */
  name: string

  /**
   * The full name of the owner + repo, e.g. "Danger/Danger-JS"
   * @type {string}
   */
  full_name: string

  /**
   * The owner of the repo
   * @type {GitHubUser}
   */
  owner: GitHubUser

  /**
   * Is the repo publicly accessible?
   * @type {boolean}
   */
  private: boolean

  /**
   * The textual description of the repo
   * @type {string}
   */
  description: string

  /**
   * Is the repo a fork?
   * @type {boolean}
   */
  fork: boolean

  /**
   * Is someone assigned to this PR?
   * @type {GitHubUser}
   */
  assignee: GitHubUser

  /**
   * Are there people assigned to this PR?
   * @type {Array<GitHubUser>}
   */
  assignees: Array<GitHubUser>
  /**
   * The root web URL for the repo, e.g. https://github.com/artsy/emission
   * @type {string}
   */
  html_url: string
}

export interface GitHubMergeRef {
  /**
   * The human display name for the merge reference, e.g. "artsy:master"
   * @type {string}
   */
  label: string

  /**
   * The reference point for the merge, e.g. "master"
   * @type {string}
   */
  ref: string

  /**
   * The reference point for the merge, e.g. "704dc55988c6996f69b6873c2424be7d1de67bbe"
   * @type {string}
   */
  sha: string

  /**
   * The user that owns the merge reference e.g. "artsy"
   */
  user: GitHubUser
  /**
   * The repo from whch the reference comes from
   */
  repo: GitHubRepo
}

/**
 * GitHubReview
 * While a review is pending, it will only have a user.  Once a review is complete, the rest of
 * the review attributes will be present
 * @export
 * @interface GitHubReview
 */
export interface GitHubReview {
  /**
   * The user requested to review, or the user who has completed the review
   * @type {GitHubUser}
   * @memberOf GitHubReview
   */
  user: GitHubUser
  /**
   * @type {number}
   * @memberOf GitHubReview
   */
  id?: number

  /**
   * The body of the review
   * @type {string}
   * @memberOf GitHubReview
   */
  body?: string

  /**
   * The commit ID this review was made on
   * @type {string}
   * @memberOf GitHubReview
   */
  commit_id?: string

  /**
   * The state of the review
   * APPROVED, REQUEST_CHANGES, COMMENT or PENDING
   * @type {string}
   * @memberOf GitHubReview
   */
  state?: "APPROVED" | "REQUEST_CHANGES" | "COMMENT" | "PENDING"

}
