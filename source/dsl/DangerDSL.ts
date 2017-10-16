import { GitDSL, GitJSONDSL } from "../dsl/GitDSL"
import { GitHubDSL } from "../dsl/GitHubDSL"
import { DangerUtilsDSL } from "./DangerUtilsDSL"

/**
 *  The root of the Danger JSON DSL.
 */

export interface DangerDSLJSONType {
  /** The data only version of Git DSL */
  git: GitJSONDSL
  /** The data only version of GitHub DSL */
  github: GitHubDSL
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

  constructor(platformDSL: any, public readonly git: GitDSL, public readonly utils: DangerUtilsDSL) {
    // As GitLab etc support is added this will need to be changed
    this.github = platformDSL
  }
}
