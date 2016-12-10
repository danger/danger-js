// @flow
"use strict"

import type { GitDSL } from "../dsl/GitDSL"
import type { GitHubDSL } from "../dsl/GitHubDSL"

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
  git: GitDSL;
  /**
   *  The GitHub metadata.
   */
  github: GitHubDSL;
}

/* END FLOWTYPE EXPORT */

export class DangerDSL {
  git: GitDSL
  github: GitHubDSL

  constructor(pr: any, git: GitDSL) {
    this.git = git
    this.github = {
      pr
    }
  }
}
