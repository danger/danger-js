import { Env, CISource } from "../ci_source/ci_source"
import { GitJSONDSL, GitDSL } from "../dsl/GitDSL"
import { GitHub } from "./GitHub"
import { GitHubAPI } from "./github/GitHubAPI"

/** A type that represents the downloaded metadata about a code review session */
export type Metadata = any

/** A type that represents a comment */
export type Comment = {
  /**
   *  UUID for the comment
   *
   * @type {string}
   */
  id: string
  /**
   * Textual representation of comment
   *
   * @type {string} body string
   */
  body: string
  /**
   * Was this posted by the account Danger has access to?
   *
   * @type {boolean} true if Danger can edit
   */
  ownedByDanger: boolean
}

export interface Platform {
  /** Mainly for logging and error reporting */
  readonly name: string
  /** Pulls in the platform specific metadata for inspection */
  getPlatformDSLRepresentation: () => Promise<any>
  /** Pulls in the Code Review Diff, and offers a succinct user-API for it */
  getPlatformGitRepresentation: () => Promise<GitJSONDSL>
  /** Can it update comments? */
  supportsCommenting: () => boolean
  /** Does the platform support inline comments? */
  supportsInlineComments: () => boolean
  /** Creates a comment on the PR */
  createComment: (dangerID: string, body: string) => Promise<any>
  /** Creates an inline comment on the PR if possible */
  // Here we pass GitDSL because platforms have different endpoints for inline comments
  // Wasn't sure if passing the dsl is the best way of achieving this, though
  createInlineComment: (git: GitDSL, comment: string, path: string, line: number) => Promise<any>
  /** Delete the main Danger comment */
  deleteMainComment: (dangerID: string) => Promise<boolean>
  /** Replace the main Danger comment */
  updateOrCreateComment: (dangerID: string, newComment: string) => Promise<any>
  /** Sets the current PR's status */
  updateStatus: (passed: boolean, message: string, url?: string) => Promise<boolean>
  /** Get the contents of a file at a path */
  getFileContents: (path: string, slug?: string, ref?: string) => Promise<string>
}

/**
 * Pulls out a platform for Danger to communicate on based on the environment
 * @param {Env} env The environment.
 * @param {CISource} source The existing source, to ensure they can run against each other
 * @returns {Platform} returns a platform if it can be supported
 */
export function getPlatformForEnv(env: Env, source: CISource): Platform {
  const token = env["DANGER_GITHUB_API_TOKEN"]
  if (!token) {
    console.error("The DANGER_GITHUB_API_TOKEN environmental variable is missing")
    console.error("Without an api token, danger will be unable to comment on a PR")
    throw new Error("Cannot use authenticated API requests.")
  }

  const api = new GitHubAPI(source, token)
  const github = new GitHub(api)
  return github
}
