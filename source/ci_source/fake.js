// @flow
"use strict"

import type { Env } from "./ci_source"

export default class FakeCI {
  env: Env
  constructor(env: Env) { this.env = env }

  get isCI() : boolean { return true }
  get isPR() : boolean { return true }

  get pullRequestID(): string { return "350" }
  get repoSlug(): string { return "artsy/emission" }
  get repoURL(): string { return "maybe not needed?" }
  get supportedPlatforms() : string[] { return ["github"] }
}
