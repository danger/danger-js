import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist } from "../ci_source_helpers"

export class Codeship implements CISource {
  constructor(private readonly env: Env) {
  }

  get name(): string { return "Codeship" }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["CODESHIP"])
  }

  get isPR(): boolean {
    if (ensureEnvKeysExist(this.env, ["CI_PULL_REQUEST"])) {
      // codeship doesn't actually support this yet -> will always be false
      return this.env.CI_PULL_REQUEST
    }
    return false;
  }

  get pullRequestID(): string {
    // this will need to retrieve from the github server, if it retrieves at all
    return '';
  }

  get repoSlug(): string {
    if (ensureEnvKeysExist(this.env, ["CI_REPO_NAME"])) {
      return this.env.CI_REPO_NAME
    }
    return '';
  }

  get supportedPlatforms(): string[] { return ["github"] }
}
