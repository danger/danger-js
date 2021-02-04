import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

export class AzureDevops implements CISource {
  constructor(private readonly env: Env) {}
  get name(): string {
    return "AzureDevops"
  }

  get isCI(): boolean {
    return true
  }
  get isPR(): boolean {
    if (ensureEnvKeysExist(this.env, ["CI_PULL_REQUEST"]) || ensureEnvKeysExist(this.env, ["CIRCLE_PULL_REQUEST"])) {
      return true
    }

    const mustHave = ["CIRCLE_CI_API_TOKEN", "CIRCLE_PROJECT_USERNAME", "CIRCLE_PROJECT_REPONAME", "CIRCLE_BUILD_NUM"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, ["CIRCLE_PR_NUMBER"])
  }
  get repoSlug(): string {
    return ""
  }
  get pullRequestID(): string {
    return this.env.BITRISE_PULL_REQUEST
  }
  get commitHash(): string {
    return this.env.BITRISE_GIT_COMMIT
  }
  get ciRunURL(): string {
    return this.env.BITRISE_PULL_REQUEST
  }
  get useEventDSL(): boolean {
    return this.env.GITHUB_EVENT_NAME !== "pull_request"
  }
}
