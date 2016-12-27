// @flow
"use strict"

import type { Env } from "./ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "./ci_source_helpers"

export default class Jenkins {
  env: Env

  constructor(env: Env) {
    this.env = env
  }

  get name(): string {
    return "Jenkins"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["JENKINS_URL"])
  }

  get isPR(): boolean {
    const mustHave = ["JENKINS_URL", "ghprbPullId", "ghprbGhRepository"]
    const mustBeInts = ["ghprbPullId"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, mustBeInts)
  }

  get pullRequestID(): string {
    return this.env.ghprbPullId
  }

  get repoSlug(): string {
    return this.env.ghprbGhRepository
  }

  get supportedPlatforms(): string[] {
    return ["github"]
  }
}
