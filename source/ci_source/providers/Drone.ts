import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

export class Drone implements CISource {
  constructor(private readonly env: Env) {
  }

  get name(): string { return "Drone" }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["DRONE"])
  }

  get isPR(): boolean {
    const mustHave = ["DRONE", "DRONE_PULL_REQUEST", "DRONE_REPO"]
    const mustBeInts = ["DRONE_PULL_REQUEST"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, mustBeInts)
  }

  get pullRequestID(): string { return this.env.DRONE_PULL_REQUEST }
  get repoSlug(): string { return this.env.DRONE_REPO }
  get supportedPlatforms(): string[] { return ["github"] }
}
