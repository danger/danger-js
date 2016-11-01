// @flow
"use strict"

import type { GitDSL } from "../dsl/GitDSL"
import type { GitHubDSL } from "../dsl/GitHubDSL"

export interface DangerDSLType {
    git: GitDSL;
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
