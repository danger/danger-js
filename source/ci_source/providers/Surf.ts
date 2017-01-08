import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

export class Surf implements CISource {
  constructor(private readonly env: Env) {
  }

  get name(): string {
    return "surf-build"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["SURF_REPO", "SURF_NWO"])
  }

  get isPR(): boolean {
    return this.isCI
  }

  get pullRequestID(): string {
    const key = "SURF_PR_NUM"
    return ensureEnvKeysAreInt(this.env, [key]) ? this.env[key] : ""
  }

  get repoSlug(): string {
    return this.env["SURF_NWO"]
  }

  get supportedPlatforms(): string[] {
    return ["github"]
  }
}
