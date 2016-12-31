// @flow
"use strict"

export default class DummyCI {
  get name(): string { return "Dummy Testing CI" }

  get isCI(): boolean { return false }
  get isPR(): boolean { return true }

  get pullRequestID(): string { return this.env.pr }
  get repoSlug(): string { return this.env.repo }
  get supportedPlatforms(): string[] { return ["github"] }
}
