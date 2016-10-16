// @flow
"use strict"

// import type { Platform } from "../platforms/platform"
import type { GitDSL } from "../dsl/Git"

export default class DangerDSL {
  git: GitDSL
  pr: any

  constructor(pr: any, git: GitDSL) {
    this.git = git
    this.pr = pr
  }
}
