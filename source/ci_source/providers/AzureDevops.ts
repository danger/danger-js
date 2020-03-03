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
    if (
      ensureEnvKeysExist(this.env, ["SYSTEM_PULLREQUEST_PULLREQUESTID"]) ||
      ensureEnvKeysExist(this.env, ["CIRCLE_PULL_REQUEST"])
    ) {
      return true
    }

    const mustHave = ["CIRCLE_CI_API_TOKEN", "CIRCLE_PROJECT_USERNAME", "CIRCLE_PROJECT_REPONAME", "CIRCLE_BUILD_NUM"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, ["CIRCLE_PR_NUMBER"])
  }
  get repoSlug(): string {
    return this.env.BUILD_REPOSITORY_NAME
  }
  get pullRequestID(): string {
    return this.env.SYSTEM_PULLREQUEST_PULLREQUESTID
  }
  get commitHash(): string {
    return this.env.SYSTEM_PULLREQUEST_SOURCECOMMITID
  }
  get ciRunURL(): string {
    return this.env.SYSTEM_PULLREQUEST_PULLREQUESTID
  }
  get useEventDSL(): boolean {
    return false
  }
}
