// @flow
"use strict"

import type { Env } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

export default class Travis {
  env: Env
  constructor(env: Env) { this.env = env }

  get name(): string { return "Travis CI" }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["HAS_JOSH_K_SEAL_OF_APPROVAL"])
  }

  get isPR(): boolean {
    const mustHave = ["HAS_JOSH_K_SEAL_OF_APPROVAL", "TRAVIS_PULL_REQUEST", "TRAVIS_REPO_SLUG"]
    const mustBeInts = ["TRAVIS_PULL_REQUEST"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, mustBeInts)
  }

  get pullRequestID(): string { return this.env.TRAVIS_PULL_REQUEST }
  get repoSlug(): string { return this.env.TRAVIS_REPO_SLUG }
  get supportedPlatforms(): string[] { return ["github"] }
}
