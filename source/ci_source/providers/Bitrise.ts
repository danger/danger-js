import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"
/**
 * ### CI Setup
 *  <!-- JS --!>
 *  You need to edit your `bitrise.yml` (in version control, or directly from UI) to include `yarn danger ci`.
 *
 *   You can set `is_always_run: true` to ensure that it reports even if previous steps fails
 *
 *   ```yaml
 *     workflows:
 *       <your_workflow_name>:
 *         steps:
 *         - yarn:
 *           inputs:
 *           - args: ci
 *           - command: danger
 *           is_always_run: true
 *   ```
 *
 *  Adding this to your `bitrise.yml` allows Danger to fail your build, both on the Bitrise website and within your Pull Request.
 *  With that set up, you can edit your job to add `yarn danger ci` at the build action.
 *
 * <!-- !JS --!>
 * <!-- Swift --!>
 *
 * No instructions yet, but basically:
 *
 * - Install Danger JS globally
 * - Run `swift build`
 * - Run `swift run danger-swift ci`
 *
 * <!-- !Swift --!>
 *
 *  ### Token Setup
 *
 *  You need to add the platform environment variables, to do this,
 *  go to your repo's secrets, which should look like: `https://www.bitrise.io/app/[app_id]#/workflow` and secrets tab.
 *
 *  You should make sure to check the case "Expose for Pull Requests?".
 */
export class Bitrise implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "Bitrise"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["BITRISE_IO"])
  }

  get isPR(): boolean {
    const mustHave = ["GIT_REPOSITORY_URL"]
    const mustBeInts = ["BITRISE_PULL_REQUEST"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, mustBeInts)
  }

  private _parseRepoURL(): string {
    const repoURL = this.env.GIT_REPOSITORY_URL
    const regexp = new RegExp("([/:])([^/]+/[^/.]+)(?:.git)?$")
    const matches = repoURL.match(regexp)
    return matches ? matches[2] : ""
  }

  get pullRequestID(): string {
    return this.env.BITRISE_PULL_REQUEST
  }

  get repoSlug(): string {
    return this._parseRepoURL()
  }

  get ciRunURL() {
    return process.env.BITRISE_PULL_REQUEST
  }
}
