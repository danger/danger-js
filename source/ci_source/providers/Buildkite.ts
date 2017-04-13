import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

export class Buildkite implements CISource {
  constructor(private readonly env: Env) {
  }

  get name(): string { return "Buildkite" }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["BUILDKITE"])
  }

  get isPR(): boolean {
    const mustHave = ["BUILDKITE_REPO"]
    const mustBeInts = ["BUILDKITE_PULL_REQUEST"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, mustBeInts)
  }

  private _parseRepoURL(): string {
    const repoURL = this.env.BUILDKITE_REPO
    const regexp = new RegExp("([\/:])([^\/]+\/[^\/.]+)(?:.git)?$")
    const matches = repoURL.match(regexp)
    return matches ? matches[2] : ""
  }

  get pullRequestID(): string { return this.env.BUILDKITE_PULL_REQUEST }
  get repoSlug(): string { return this._parseRepoURL() }
  get supportedPlatforms(): string[] { return ["github"] }
}
