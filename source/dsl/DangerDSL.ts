import { GitDSL, GitJSONDSL } from "../dsl/GitDSL"
import { GitHubDSL } from "../dsl/GitHubDSL"
import { DangerUtilsDSL } from "./DangerUtilsDSL"

export interface DangerJSON {
  danger: DangerDSLJSONType
}

/**
 *  The root of the Danger JSON DSL.
 */

export interface DangerDSLJSONType {
  /** The data only version of Git DSL */
  git: GitJSONDSL
  /** The data only version of GitHub DSL */
  github: GitHubDSL
  /**
   * Used in the Danger JSON DSL to pass metadata between
   * processes. It will be undefined when used inside the Danger DSL
   */
  settings: {
    /**
     * Saves each client re-implmenting logic to grab these vars
     * for their API clients
     */
    github: {
      /** API token for the GitHub client to use */
      accessToken: string
      /** Optional URL for enterprise GitHub */
      baseURL: string | undefined
      /** Optional headers to add to a request */
      additionalHeaders: any
    }
    /**
     * This is still a bit of a WIP, but this should
     * pass args/opts from the original CLI call through
     * to the process.
     */
    cliArgs: any
  }
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
  readonly git: GitDSL
  /**
   *  The GitHub metadata. This covers things like PR info,
   *  comments and reviews on the PR, label metadata, commits with
   *  GitHub user identities and some useful utility functions
   *  for displaying links to files.
   *
   *  Also provides an authenticated API so you can work directly
   *  with the GitHub API. That is an instance of the "github" npm module.
   */
  readonly github: GitHubDSL

  /**
   * Functions which are gloablly useful in most Dangerfiles. Right
   * now, these functions are around making sentences of arrays, or
   * for making hrefs easily.
   */
  readonly utils: DangerUtilsDSL
}

/// End of Danger DSL definition

export class DangerDSL {
  public readonly github: GitHubDSL

  constructor(platformDSL: any, public readonly git: GitJSONDSL, public readonly utils: DangerUtilsDSL) {
    // As GitLab etc support is added this will need to be changed
    this.github = platformDSL
  }
}
