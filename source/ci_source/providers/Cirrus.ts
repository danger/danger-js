import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

/**
 * ### CI Setup
 *
 *  You need to edit your `.cirrus.yml` to add a `script` like this:
 *
 *   ```yaml
 *     danger_script:
 *       - yarn danger ci
 *   ```
 *
 *  ### Token Setup
 *
 *  You need to add the `DANGER_GITHUB_API_TOKEN` environment variable, to do this,
 *  go to your repo's settings, by clicking the gear at `https://cirrus-ci.com/github/[user]/[repo]`.
 *  Generate the encrypted value, and add it to your `env` block.
 *
 *  Once you have added it, trigger a build.
 */
export class Cirrus implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "Cirrus CI"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["CIRRUS_CI"])
  }

  get isPR(): boolean {
    const mustHave = ["CIRRUS_CI", "CIRRUS_PR", "CIRRUS_REPO_FULL_NAME"]
    const mustBeInts = ["CIRRUS_PR"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, mustBeInts)
  }

  get pullRequestID(): string {
    return this.env.CIRRUS_PR
  }

  get repoSlug(): string {
    return this.env.CIRRUS_REPO_FULL_NAME
  }

  get ciRunURL() {
    return `https://cirrus-ci.com/task/${this.env.CIRRUS_TASK_ID}`
  }
}
