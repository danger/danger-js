// Please don't have includes in here that aren't inside the DSL folder, or the d.ts/flow defs break

import { GitCommit } from "./Commit"
import { Octokit as GitHub } from "@octokit/rest"

// This is `danger.github` inside the JSON

export interface GitHubJSONDSL {
  /** The issue metadata for a code review session */
  issue: GitHubIssue
  /** The PR metadata for a code review session */
  pr: GitHubPRDSL
  /** The PR metadata specifically formatted for using with the GitHub API client */
  thisPR: GitHubAPIPR
  /** The github commit metadata for a code review session */
  commits: GitHubCommit[]
  /** The reviews left on this pull request */
  reviews: GitHubReview[]
  /** The people/teams requested to review this PR */
  requested_reviewers: GitHubReviewers
}

// This is `danger.github`

/** The GitHub metadata for your PR */
export interface GitHubDSL extends GitHubJSONDSL {
  /**
   * An authenticated API so you can extend danger's behavior by using the [GitHub v3 API](https://developer.github.com/v3/).
   *
   * A set up instance of the "github" npm module. You can get the full [API here](https://octokit.github.io/node-github/).
   */
  api: GitHub
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

  /**
   * Downloads a file's contents via the GitHub API. You'll want to use
   * this instead of `fs.readFile` when aiming to support working with Peril.
   *
   * @param {string} path The path fo the file that exists
   * @param {string} repoSlug An optional reference to the repo's slug: e.g. danger/danger-js
   * @param {string} ref An optional reference to a branch/sha
   */
  fileContents(path: string, repoSlug?: string, ref?: string): Promise<string>

  /**
   * An API for creating, updating and closing an issue. Basically
   * this is really useful for reporting back via a separate
   * issue that you may want to keep up to date at all times.
   *
   * @param {string} id The unique ID for the message to create, close
   * @param {string} content the content of the message
   * @param {any} config settings for the issue
   * @returns {string} A HTML string of <a>'s built as a sentence.
   */
  createUpdatedIssueWithID: (
    id: string,
    content: string,
    config: { title: string; open: boolean; owner: string; repo: string }
  ) => Promise<string>

  /**
   * An API for creating, or setting a label to an issue. Usable from Peril
   * by adding an additional param for settings about a repo.
   *
   * @param {obj} labelConfig The config for the label
   * @param {obj | undefined} Optional: the config for the issue
   * @returns {Promise<undefined>} No return value.
   */
  createOrAddLabel: (
    labelConfig: { name: string; color: string; description: string },
    repoConfig?: { owner: string; repo: string; id: number }
  ) => Promise<void>
  createOrUpdatePR: (
    config: {
      /** PR title */
      title: string
      /** PR body */
      body: string
      /** The danger in danger/danger-js - defaults to the PR base name if undefined */
      owner?: string
      /** The danger-js in danger/danger-js - defaults to the PR base repo if undefined */
      repo?: string
      /** A message for the commit */
      commitMessage: string
      /** The name of the branch on the repo */
      newBranchName: string
      /** Base branch for the new branch e.g. what should Danger create the new branch from */
      baseBranch: string
    },
    fileMap: any
  ) => Promise<any>
}

/**
 * This is `danger.github.issue` It refers to the issue that makes up the Pull Request.
 * GitHub treats all pull requests as a special type of issue. This DSL contains only parts of the issue that are
 * not found in the PR DSL, however it does contain the full JSON structure.
 *
 * A GitHub Issue
 */
export interface GitHubIssue {
  /**
   * The labels associated with this issue
   */
  labels: GitHubIssueLabel[]
}

// Subtypes specific to issues

export interface GitHubIssueLabel {
  /** The identifying number of this label */
  id: number

  /** The URL that links to this label */
  url: string

  /** The name of the label */
  name: string

  /** The color associated with this label */
  color: string
}

export interface GitHubIssueComment {
  /**
   *  UUID for the comment
   */
  id: string

  /**
   * The User who made the comment
   */
  user: GitHubUser

  /**
   * Textual representation of comment
   */
  body: string
}

// This is `danger.github.pr`

/**
 * An exact copy of the PR's reference JSON. This interface has type'd the majority
 * of it for tooling's sake, but any extra metadata which GitHub send will still be
 * inside the JS object.
 */

export interface GitHubPRDSL {
  /**
   * The UUID for the PR
   */
  number: number

  /**
   * The state for the PR
   */
  state: "closed" | "open" | "locked" | "merged"

  /**
   * Has the PR been locked to contributors only?
   */
  locked: boolean

  /**
   * The title of the PR
   */
  title: string

  /**
   * The markdown body message of the PR
   */
  body: string

  /**
   * ISO6801 Date string for when PR was created
   */
  created_at: string

  /**
   * ISO6801 Date string for when PR was updated
   */
  updated_at: string

  /**
   * optional ISO6801 Date string for when PR was closed
   */
  closed_at: string | null

  /**
   * Optional ISO6801 Date string for when PR was merged.
   * Danger probably shouldn't be running in this state.
   */
  merged_at: string | null

  /**
   * Merge reference for the _other_ repo.
   */
  head: GitHubMergeRef

  /**
   * Merge reference for _this_ repo.
   */
  base: GitHubMergeRef

  /**
   * The User who submitted the PR
   */
  user: GitHubUser

  /**
   * The User who is assigned the PR
   */
  assignee: GitHubUser

  /**
   * The Users who are assigned to the PR
   */
  assignees: GitHubUser[]

  /**
   * Has the PR been merged yet?
   */
  merged: boolean

  /**
   * The number of comments on the PR
   */
  comments: number

  /**
   * The number of review-specific comments on the PR
   */
  review_comments: number

  /**
   * The number of commits in the PR
   */
  commits: number

  /**
   * The number of additional lines in the PR
   */
  additions: number

  /**
   * The number of deleted lines in the PR
   */
  deletions: number

  /**
   * The number of changed files in the PR
   */
  changed_files: number

  /**
   * The link back to this PR as user-facing
   */
  html_url: string

  /** How does the PR author relate to this repo/org? */
  author_association:
    | "COLLABORATOR"
    | "CONTRIBUTOR"
    | "FIRST_TIMER"
    | "FIRST_TIME_CONTRIBUTOR"
    | "MEMBER"
    | "NONE"
    | "OWNER"
}

// These are the individual subtypes of objects inside the larger DSL objects above.

/** A GitHub specific implementation of a git commit, it has GitHub user names instead of an email. */
export interface GitHubCommit {
  /** The raw commit metadata */
  commit: GitCommit
  /** The SHA for the commit */
  sha: string
  /** the url for the commit on GitHub */
  url: string
  /** The GitHub user who wrote the code */
  author: GitHubUser
  /** The GitHub user who shipped the code */
  committer: GitHubUser
  /** An array of parent commit shas */
  parents: any[]
}

/**
 * A GitHub user account.
 */
export interface GitHubUser {
  /**
   * Generic UUID
   */
  id: number
  /**
   * The handle for the user/org
   */
  login: string
  /**
   * Whether the user is an org, or a user
   */
  type: "User" | "Organization" | "Bot"
  /**
   * The url for a users's image
   */
  avatar_url: string
  /**
   * The href for a users's page
   */
  href: string
}

/**
 * A GitHub Repo
 */
export interface GitHubRepo {
  /**
   * Generic UUID
   */
  id: number

  /**
   * The name of the repo, e.g. "Danger-JS"
   */
  name: string

  /**
   * The full name of the owner + repo, e.g. "Danger/Danger-JS"
   */
  full_name: string

  /**
   * The owner of the repo
   */
  owner: GitHubUser

  /**
   * Is the repo publicly accessible?
   */
  private: boolean

  /**
   * The textual description of the repo
   */
  description: string

  /**
   * Is the repo a fork?
   */
  fork: boolean

  /**
   * Is someone assigned to this PR?
   */
  assignee: GitHubUser

  /**
   * Are there people assigned to this PR?
   */
  assignees: GitHubUser[]
  /**
   * The root web URL for the repo, e.g. https://github.com/artsy/emission
   */
  html_url: string
}

export interface GitHubMergeRef {
  /**
   * The human display name for the merge reference, e.g. "artsy:master"
   */
  label: string

  /**
   * The reference point for the merge, e.g. "master"
   */
  ref: string

  /**
   * The reference point for the merge, e.g. "704dc55988c6996f69b6873c2424be7d1de67bbe"
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
   */
  user: GitHubUser
  /**
   * If there is a review, this provides the ID for it
   */
  id?: number

  /**
   * If there is a review, the body of the review
   */
  body?: string

  /**
   * If there is a review, the commit ID this review was made on
   */
  commit_id?: string

  /**
   * The state of the review
   * APPROVED, REQUEST_CHANGES, COMMENT or PENDING
   */
  state?: "APPROVED" | "REQUEST_CHANGES" | "COMMENT" | "PENDING"
}

/** Provides the current PR in an easily used way for params in `github.api` calls  */
export interface GitHubAPIPR {
  /** The repo owner */
  owner: string
  /** The repo name */
  repo: string
  /** The PR number */
  number: number
}

export interface GitHubReviewers {
  /** Users that have been requested */
  users: GitHubUser[]
  /** Teams that have been requested */
  teams: any[]
}
