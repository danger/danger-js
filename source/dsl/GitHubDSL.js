// @flow
"use strict"

export interface GitHubDSL {
  /**
   * The PR metadata for a code review session
   * @type {GitHubPRDSL}
   */
  pr: GitHubPRDSL
}

/**
 * A GitHub user account
 */
export interface GitHubUser {
  /**
   * Generic UUID
   * @type {number}
   */
  id: number,
  /**
   * The handle for the user/org
   * @type {string}
   */
  login: string,
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
  id: number,

  /**
   * The name of the repo, e.g. "Danger-JS"
   * @type {string}
   */
  name: string,

  /**
   * The full name of the owner + repo, e.g. "Danger/Danger-JS"
   * @type {string}
   */
  full_name: string,

  /**
   * The owner of the repo
   * @type {GitHubUser}
   */
  owner: GitHubUser,

  /**
   * Is the repo publicly accessible?
   * @type {bool}
   */
  private: bool,

  /**
   * The textual description of the repo
   * @type {string}
   */
  description: string,

  /**
   * Is the repo a fork?
   * @type {bool}
   */
  fork: false
}

export interface GitHubMergeRef {
  /**
   * The human display name for the merge reference, e.g. "artsy:master"
   * @type {string}
   */
  label: string,

  /**
   * The reference point for the merge, e.g. "master"
   * @type {string}
   */
  ref: string,

  /**
   * The reference point for the merge, e.g. "704dc55988c6996f69b6873c2424be7d1de67bbe"
   * @type {string}
   */
  sha: string,

  /**
   * The user that owns the merge reference e.g. "artsy"
   * @type {string}
   */
  user: GitHubUser
}

export interface GitHubPRDSL {
  /**
   * The UUID for the PR
   * @type {number}
   */
  number: number,

  /**
   * The state for the PR
   * @type {string}
   */
  state: "closed" | "open" | "locked" | "merged",

  /**
   * Has the PR been locked to contributors only?
   * @type {boolean}
   */
  locked: boolean,

  /**
   * The title of the PR
   * @type {string}
   */
  title: string,

  /**
   * The markdown body message of the PR
   * @type {string}
   */
  body: string,

  /**
   * ISO6801 Date string for when PR was created
   * @type {string}
   */
  created_at: string,

  /**
   * ISO6801 Date string for when PR was updated
   * @type {string}
   */
  updated_at: string,

  /**
   * optional ISO6801 Date string for when PR was closed
   * @type {string}
   */
  closed_at: ?string,

  /**
   * Optional ISO6801 Date string for when PR was merged.
   * Danger probably shouldn't be running in this state.
   * @type {string}
   */
  merged_at: ?string,

  /**
   * Merge reference for the _other_ repo.
   * @type {GitHubMergeRef}
   */
  head: GitHubMergeRef,

  /**
   * Merge reference for _this_ repo.
   * @type {GitHubMergeRef}
   */
  base: GitHubMergeRef,

  /**
   * The User who submitted the PR
   * @type {GitHubUser}
   */
  user: GitHubUser
}

