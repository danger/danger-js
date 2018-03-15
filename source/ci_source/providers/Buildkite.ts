import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

/**
 * ### CI Setup
 *
 * With BuildKite you run the server yourself, so you will want to run  it as a part of your build process.
 * It is common to have build steps, so we would recommend adding this to your scrip:
 *
 *  ``` shell
 *   echo "--- Running Danger"
 *   bundle exec danger
 *  ```
 *
 * ### Token Setup
 *
 * #### GitHub
 *
 * As this is self-hosted, you will need to add the `DANGER_GITHUB_API_TOKEN` to your build user's ENV. The  alternative
 * is to pass in the token as a prefix to the command `DANGER_GITHUB_API_TOKEN="123" bundle exec danger`.
 */
export class Buildkite implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "Buildkite"
  }

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
    const regexp = new RegExp("([/:])([^/]+/[^/.]+)(?:.git)?$")
    const matches = repoURL.match(regexp)
    return matches ? matches[2] : ""
  }

  get pullRequestID(): string {
    return this.env.BUILDKITE_PULL_REQUEST
  }

  get repoSlug(): string {
    return this._parseRepoURL()
  }

  get ciRunURL() {
    return process.env.BUILDKITE_BUILD_URL
  }
}
