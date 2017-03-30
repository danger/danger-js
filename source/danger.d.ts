export type MarkdownString = string

/** A platform agnostic reference to a Git commit */
export interface GitCommit {
  /** The SHA for the commit */
  sha: string,
  /** Who wrote the commit */
  author: GitCommitAuthor,
  /** Who deployed the commit */
  committer: GitCommitAuthor,
  /** The commit message */
  message: string,
  /** Potential parent commits, and other assorted metadata */
  tree: any,
  /** SHAs for the commit's parents */
  parents?: string[],
}

/** An author of a commit */
export interface GitCommitAuthor {
  /** The display name for the author */
  name: string,
  /** The authors email */
  email: string,
  /** ISO6801 date string */
  date: string
}
/**
 *  The Danger DSL provides the metadata for introspection
 *  in order to create your own rules.
 */
export interface DangerDSLType {
  /**
   *  Details specific to the git changes within the code changes.
   *  Currently, this is just the raw file paths that have been
   *  added, removed or modified.
   */
  readonly git: Readonly<GitDSL>
  /**
   *  The GitHub metadata.
   */
  readonly github: Readonly<GitHubDSL>

  /**
   * Danger utils
   */
  readonly utils: Readonly<DangerUtilsDSL>
}
/**
 * Representation of what running a Dangerfile generates.
 * In the future I'd like this to be cross process, so please
 * do not add functions, only data to this interface.
 */
export interface DangerResults {

  /**
   * Failed messages
   */
  fails: Array<Violation>

  /**
   * Messages for info
   */
  warnings: Array<Violation>

  /**
   * Markdown messages
   */
  messages: Array<Violation>

  /**
   * Markdown messages at the bottom of the comment
   */
  markdowns: Array<MarkdownString>
}

export interface DangerRuntimeContainer extends DangerResults {
  /**
   * Asynchronous functions to be run after parsing
   */
  scheduled: Array<Function>
}
/**
 * The Danger Utils DSL contains utility functions
 * that are specific to universal Danger use-cases.
 */
export interface DangerUtilsDSL {

  /**
   * Creates a link using HTML.
   *
   * If `href` and `text` are falsy, null is returned.
   * If `href` is falsy and `text` is truthy, `text` is returned.
   * If `href` is truthy and `text` is falsy, an <a> tag is returned with `href` as its href and text value.
   * Otherwise, if `href` and `text` are truthy, an <a> tag is returned with the `href` and `text` inserted as expected.
   *
   * @param {string} href The HTML link's destination.
   * @param {string} text The HTML link's text.
   * @returns {string|null} The HTML <a> tag.
   */
  href(href: string, text: string): string | null

  /**
   * Converts an array of strings into a sentence.
   *
   * @param {Array<string>} array The array of strings.
   * @returns {string} The sentence.
   */
  sentence(array: Array<string>): string
}
/** The results of running a JSON patch */
export interface JSONPatch {
  /** The JSON in a file at the PR merge base */
  before: any,
  /** The JSON in a file from the PR submitter */
  after: any,
  /** The set of operations to go from one JSON to another JSON */
  diff: Array<JSONPatchOperation>
}

/** An individual operation inside an rfc6902 JSON Patch */
export interface JSONPatchOperation {
  /** An operation type */
  op: string
  /** The JSON keypath which the operation applies on */
  path: string
  /** The changes for applied */
  value: string
}

/** All JSON diff values will be this shape */
export interface JSONDiffValue {
  /** The value before the PR's applied changes */
  before: any
  /** The value after the PR's applied changes */
  after: any
  /** If both before & after are arrays, then you optionally get what is added. Emprty is no additional objects. */
  added?: any[],
  /** If both before & after are arrays, then you optionally get what is removed. Emprty is no removed objects. */
  removed?: any[]
}

/** A map of string keys to JSONDiffValue */
export interface JSONDiff {
  [name: string]: JSONDiffValue
}

// This is `danger.git`

/** The git specific metadata for a PR */
export interface GitDSL {
  /**
   * Filepaths with changes relative to the git root
   */
  readonly modified_files: Array<string>

  /**
   * Newly created filepaths relative to the git root
   */
  readonly created_files: Array<string>

  /**
   * Removed filepaths relative to the git root
   */
  readonly deleted_files: Array<string>

  /** Offers the diff for a specific file */
  diffForFile(filename: string): string | null,

  /**
   * Provides a JSON patch (rfc6902) between the two versions of a JSON file,
   * returns null if you don't have any changes for the file in the diff.
   *
   * Note that if you are looking to just see changes like: before, after, added or removed - you
   * should use `JSONDiffForFile` instead, as this can be a bit unweildy for a Dangerfile.
   *
   * @param {string} filename the path to the json file
   */
  JSONPatchForFile(filename: string): Promise<JSONPatch | null>,

  /**
   * Provides a simplified JSON diff between the two versions of a JSON file. This will always
   * be an object whose keys represent what has changed inside a JSON file.
   *
   * Any changed values will be represented with the same path, but with a different object instead.
   * This object will always show a `before` and `after` for the changes. If both values are arrays or
   * objects the `before` and `after`, then there will also be `added` and `removed` inside the object.
   *
   * In the case of two objects, the `added` and `removed` will be an array of keys rather than the values.
   *
   * This object is represented as `JSONDiffValue` but I don't know how to make TypeScript force
   * declare that kind of type structure.
   *
   * This should make it really easy to do work when specific keypaths have changed inside a JSON file.
   *
   * @param {string} filename the path to the json file
   */
  JSONDiffForFile(filename: string): Promise<JSONDiff>,

  /** The Git commit metadata */
  readonly commits: Array<GitCommit>
}
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
   */

  labels: Array<GitHubIssueLabel>
}

// Subtypes specific to issues

export interface GitHubIssueLabel {
  /**
   * The identifying number of this label
   * @memberOf GitHubIssueLabel
   */
  id: number,

  /**
   * The URL that links to this label
   * @memberOf GitHubIssueLabel
   */
  url: string,

  /**
   * The name of the label
   * @memberOf GitHubIssueLabel
   */
  name: string,

  /**
   * The color associated with this label
   * @memberOf GitHubIssueLabel
   */
  color: string
}

// This is `danger.github.pr`

/** What a PR's JSON looks like */
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
  assignees: Array<GitHubUser>

  /**
   * Has the PR been merged yet
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
   */
  id: number
  /**
   * The handle for the user/org
   */
  login: string
  /**
   * Whether the user is an org, or a user
   */
  type: "User" | "Organization"
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
  assignees: Array<GitHubUser>
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
   * @memberOf GitHubReview
   */
  user: GitHubUser
  /**
   * @memberOf GitHubReview
   */
  id?: number

  /**
   * The body of the review
   * @memberOf GitHubReview
   */
  body?: string

  /**
   * The commit ID this review was made on
   * @memberOf GitHubReview
   */
  commit_id?: string

  /**
   * The state of the review
   * APPROVED, REQUEST_CHANGES, COMMENT or PENDING
   * @memberOf GitHubReview
   */
  state?: "APPROVED" | "REQUEST_CHANGES" | "COMMENT" | "PENDING"

}

/**
 * The result of user doing warn, message or fail.
 */
export interface Violation {
  /**
   * The string representation
   *
   */
  message: string
}
  /**
   * Contains asynchronous code to be run after the application has booted.
   *
   * @param {Function} asyncFunction the function to run asynchronously
   */
declare function schedule(asyncFunction: (p: Promise<any>) => void): void

  /**
   * Fails a build, outputting a specific reason for failing
   *
   * @param {MarkdownString} message the String to output
   */
declare function fail(message: MarkdownString): void

  /**
   * Highlights low-priority issues, does not fail the build
   *
   * @param {MarkdownString} message the String to output
   */
declare function warn(message: MarkdownString): void

  /**
   * Puts a message inside the Danger table
   *
   * @param {MarkdownString} message the String to output
   */
declare function message(message: MarkdownString): void

  /**
   * Puts a message inside the Danger table
   *
   * @param {MarkdownString} message the String to output
   */
declare function markdown(message: MarkdownString): void

  /** Typical console */
declare const console: Console

  /**
   * The Danger object to work with
   *
   */
declare const danger: DangerDSLType
  /**
   * Results of a Danger run
   *
   */
declare const results: DangerRuntimeContainer
