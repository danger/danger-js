import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

/**
 * Nevercode.io CI Integration
 *
 * Environment Variables Documented: https://developer.nevercode.io/v1.0/docs/environment-variables-files
 */
export class Nevercode implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "Nevercode"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["NEVERCODE"])
  }

  get isPR(): boolean {
    const mustHave = ["NEVERCODE_PULL_REQUEST", "NEVERCODE_REPO_SLUG"]
    const mustBeInts = ["NEVERCODE_GIT_PROVIDER_PULL_REQUEST", "NEVERCODE_PULL_REQUEST_NUMBER"]
    return (
      ensureEnvKeysExist(this.env, mustHave) &&
      ensureEnvKeysAreInt(this.env, mustBeInts) &&
      this.env.NEVERCODE_PULL_REQUEST == "true"
    )
  }

  get pullRequestID(): string {
    return this.env.NEVERCODE_PULL_REQUEST_NUMBER
  }

  get repoSlug(): string {
    return this.env.NEVERCODE_REPO_SLUG
  }

  get supportedPlatforms(): string[] {
    return ["github"]
  }

  get ciRunURL() {
    return process.env.NEVERCODE_BUILD_URL
  }
}
