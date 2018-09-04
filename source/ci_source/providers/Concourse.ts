import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

/**
 * Concourse CI Integration
 *
 * https://concourse-ci.org/
 */
export class Concourse implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "Concourse"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["CONCOURSE"])
  }

  get isPR(): boolean {
    const mustHave = ["PULL_REQUEST_ID", "REPO_SLUG"]
    const mustBeInts = ["PULL_REQUEST_ID"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, mustBeInts)
  }

  get pullRequestID(): string {
    return this.env.PULL_REQUEST_ID
  }

  get repoSlug(): string {
    return this.env.REPO_SLUG
  }

  get ciRunURL() {
    return this.env.BUILD_URL
  }
}
