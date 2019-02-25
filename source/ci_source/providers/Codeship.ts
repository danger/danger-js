import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, getPullRequestIDForBranch } from "../ci_source_helpers"

// Codeship Pro: https://documentation.codeship.com/pro/builds-and-configuration/environment-variables/
// Codeship Basic: https://documentation.codeship.com/basic/builds-and-configuration/set-environment-variables/

/**
 * ### CI Setup
 *
 * To make Danger run, add a new step to the `codeship-steps.yml` file:
 *
 * ```
 * - type: parallel:
 *   ...
 *    - name: danger
 *      service: web
 *      command: [run_command]
 * ```
 *
 * If you're using Codeship Classic, add `[run_command]` to your 'Test Commands'
 *
 * ### Token Setup
 *
 * You'll want to edit your `codeship-services.yml` file to include a reference
 * to the Danger authentication token: `DANGER_GITHUB_API_TOKEN`.
 *
 * ```
 * project_name:
 *   ...
 *   environment:
 *     - DANGER_GITHUB_API_TOKEN=[my_token]
 * ```
 *
 * If you're using Codeship Classic, add `DANGER_GITHUB_API_TOKEN` to your
 * 'Environment' settings.
 */

export class Codeship implements CISource {
  private default = { prID: "0" }
  constructor(private readonly env: Env) {}

  async setup(): Promise<any> {
    const prID = await getPullRequestIDForBranch(this, this.env, this.branchName)
    this.default.prID = prID.toString()
  }

  get name(): string {
    return "Codeship"
  }

  get isCI(): boolean {
    if (ensureEnvKeysExist(this.env, ["CI_NAME"]) && this.env.CI_NAME === "codeship") {
      return true
    }
    return false
  }

  get isPR(): boolean {
    return this.pullRequestID !== "0"
  }

  get pullRequestID(): string {
    return this.default.prID
  }

  get repoSlug(): string {
    if (ensureEnvKeysExist(this.env, ["CI_REPO_NAME"])) {
      return this.env.CI_REPO_NAME
    }
    return ""
  }

  private get branchName(): string {
    return this.env.CI_BRANCH
  }
}
