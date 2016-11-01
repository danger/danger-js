// @flow
"use strict"

import type { GitDSL } from "../dsl/GitDSL"
import type { GitHubDSL } from "../dsl/GitHubDSL"

export default class DangerDSL {
  git: GitDSL
  github: GitHubDSL

  constructor(pr: any, git: GitDSL) {
    this.git = git
    this.github = {
      pr
    }
  }
}
