// @flow
"use strict"

import type { Env } from "./ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "./ci_source_helpers"

export default class Semaphore {
  env: Env
  constructor(env: Env) { this.env = env }

  get name(): string { return "Travis CI" }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["SEMAPHORE"])
  }

  get isPR(): boolean {
    const mustHave = ["SEMAPHORE_REPO_SLUG"]
    const mustBeInts = ["PULL_REQUEST_NUMBER"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, mustBeInts)
  }

  get pullRequestID(): string { return this.env.PULL_REQUEST_NUMBER }
  get repoSlug(): string { return this.env.SEMAPHORE_REPO_SLUG }
  get supportedPlatforms(): string[] { return ["github"] }
}
