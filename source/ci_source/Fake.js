// @flow
"use strict"

import type { Env } from "./ci_source"

export default class FakeCI {
  env: Env
  constructor(env: Env) {
    const defaults = {
      repo: env.DANGER_TEST_REPO || "artsy/emission",
      pr: env.DANGER_TEST_PR || "327"
    }

    this.env = {...env, ...defaults}
  }
  get name(): string { return "Fake Testing CI" }

  get isCI(): boolean { return true }
  get isPR(): boolean { return true }

  get pullRequestID(): string { return this.env.pr }
  get repoSlug(): string { return this.env.repo }
  get repoURL(): string { return "maybe not needed?" }
  get supportedPlatforms(): string[] { return ["github"] }
}
