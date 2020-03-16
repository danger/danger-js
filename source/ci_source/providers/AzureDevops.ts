import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist } from "../ci_source_helpers"

export class AzureDevops implements CISource {
  constructor(private readonly env: Env) {}
  get name(): string {
    return "AzureDevops"
  }

  get isCI(): boolean {
    return true
  }
  get isPR(): boolean {
    return ensureEnvKeysExist(this.env, ["SYSTEM_PULLREQUEST_PULLREQUESTID", "SYSTEM_PULLREQUEST_PULLREQUESTNUMBER"])
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
