import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

export class BuddyBuild implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "buddybuild"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["BUDDYBUILD_BUILD_ID"])
  }

  get isPR(): boolean {
    const mustHave = ["BUDDYBUILD_PULL_REQUEST", "BUDDYBUILD_REPO_SLUG"]
    const mustBeInts = ["BUDDYBUILD_PULL_REQUEST"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, mustBeInts)
  }

  get pullRequestID(): string {
    return this.env.BUDDYBUILD_PULL_REQUEST
  }

  get repoSlug(): string {
    return this.env.BUDDYBUILD_REPO_SLUG
  }

  get supportedPlatforms(): Array<string> {
    return ["github"]
  }
}
