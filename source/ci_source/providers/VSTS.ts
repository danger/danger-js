import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist } from "../ci_source_helpers"
/**
 * ### CI Setup
 *  You'll need to add a npm build step and set the custom command to "run danger"
 *
 *  Only supports VSTS with github as the repository, danger doesn't yet support VSTS as a repository platform
 *
 *  ### Token Setup
 *
 *  You need to add the `DANGER_GITHUB_API_TOKEN` environment variable
 */
export class VSTS implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "Visual Studio Team Services"
  }

  get isCI(): boolean {
    return (
      ensureEnvKeysExist(this.env, ["SYSTEM_TEAMFOUNDATIONCOLLECTIONURI", "BUILD_REPOSITORY_PROVIDER"]) &&
      this.env.BUILD_REPOSITORY_PROVIDER == "GitHub"
    )
  }

  get isPR(): boolean {
    const mustHave = ["BUILD_SOURCEBRANCH", "BUILD_REPOSITORY_PROVIDER", "BUILD_REASON", "BUILD_REPOSITORY_NAME"]

    return ensureEnvKeysExist(this.env, mustHave) && this.env.BUILD_REASON == "PullRequest"
  }

  get pullRequestID(): string {
    const match = this.env.BUILD_SOURCEBRANCH.match(/refs\/pull\/([0-9]+)\/merge/)

    if (match && match.length > 1) {
      return match[1]
    }

    return ""
  }

  get repoSlug(): string {
    return this.env.BUILD_REPOSITORY_NAME
  }
}
