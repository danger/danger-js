import { GitDSL } from "../dsl/GitDSL"
import { GitHubDSL } from "../dsl/GitHubDSL"
import { DangerUtilsDSL } from "./DangerUtilsDSL"

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

/* END FLOWTYPE EXPORT */

export class DangerDSL {
  public readonly github: Readonly<GitHubDSL>

  constructor(platformDSL: any, public readonly git: GitDSL, public readonly utils: DangerUtilsDSL) {
    // As GitLab etc support is added this will need to be changed
    this.github = platformDSL
  }
}
