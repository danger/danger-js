import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

/**
 * ### CI Setup
 *
 * Install dependencies and add a danger step to your screwdriver.yaml:
 *
 * ```yml
 * jobs:
 *   danger:
 *     requires: [~pr, ~commit]
 *     steps:
 *       - setup: yarn install
 *       - danger: yarn danger ci
 *     secrets:
 *       - DANGER_GITHUB_API_TOKEN
 * ```
 *
 * ### Token Setup
 *
 * Add the `DANGER_GITHUB_API_TOKEN` to your pipeline env as a
 * [build secret](https://docs.screwdriver.cd/user-guide/configuration/secrets)
 */
export class Screwdriver implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "Screwdriver"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["SCREWDRIVER"])
  }

  get isPR(): boolean {
    const mustHave = ["SCM_URL"]
    const mustBeInts = ["SD_PULL_REQUEST"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, mustBeInts)
  }

  private _parseRepoURL(): string {
    const repoURL = this.env.SCM_URL
    const regexp = new RegExp("([/:])([^/]+/[^/.]+)(?:.git)?$")
    const matches = repoURL.match(regexp)
    return matches ? matches[2] : ""
  }

  get pullRequestID(): string {
    return this.env.SD_PULL_REQUEST
  }

  get repoSlug(): string {
    return this._parseRepoURL()
  }

  get ciRunURL() {
    return process.env.BUILDKITE_BUILD_URL
  }
}
