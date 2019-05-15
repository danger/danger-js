import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, getPullRequestIDForBranch } from "../ci_source_helpers"
import * as url from "url"

// AppCenter Build scripts: https://docs.microsoft.com/en-us/appcenter/build/custom/scripts/
// AppCenter Environment variables: https://docs.microsoft.com/en-us/appcenter/build/custom/variables/

/**
 * ### CI Setup
 *
 * To make Danger run, add following lines to the `appcenter-pre-build.sh` file:
 *
 * ```
 * - swift build
 * - swift run danger-swift ci
 * ```
 *
 *
 * ### Token Setup
 *
 * Add the `DANGER_GITHUB_API_TOKEN` to your environment variables.
 *
 */

export class AppCenter implements CISource {
  private default = { prID: "0" }
  constructor(private readonly env: Env) {}

  async setup(): Promise<any> {
    const prID = await getPullRequestIDForBranch(this, this.env, this.branchName)
    this.default.prID = prID.toString()
  }

  get name(): string {
    return "AppCenter"
  }

  get isCI(): boolean {
    if (ensureEnvKeysExist(this.env, ["APPCENTER_BUILD_ID"])) {
      return true
    } else {
      return false
    }
  }

  get isPR(): boolean {
    return this.env["BUILD_REASON"] == "PullRequest"
  }

  get pullRequestID(): string {
    return this.default.prID
  }

  get repoSlug(): string {
    if (
      ensureEnvKeysExist(this.env, ["BUILD_REPOSITORY_NAME"]) &&
      ensureEnvKeysExist(this.env, ["BUILD_REPOSITORY_NAME"])
    ) {
      const repositoryName = this.env["BUILD_REPOSITORY_NAME"]
      const components = url.parse(this.env["BUILD_REPOSITORY_URI"], false)
      if (components && components.path) {
        const owner = components.path.split("/")[1]
        return `${owner}/${repositoryName}`
      }
    }
    return ""
  }

  private get branchName(): string {
    return this.env["BUILD_SOURCEBRANCHNAME"]
  }
}
