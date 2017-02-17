import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

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

  private _prParseURL(): {owner?: string, reponame?: string, id?: string} {
    const prUrl = this.env.CI_PULL_REQUEST || ""
    const splitSlug = prUrl.split("/")
    if (splitSlug.length === 7) {
      const owner = splitSlug[3]
      const reponame = splitSlug[4]
      const id = splitSlug[6]
      return {owner, reponame, id}
    };
    return {}
  }

  get pullRequestID(): string {
    if (this.env.CIRCLE_PR_NUMBER) {
      return this.env.CIRCLE_PR_NUMBER
    } else {
      const {id} = this._prParseURL()
      return id || ""
    }
  }

  get repoSlug(): string {
    if (ensureEnvKeysExist(this.env, ["CI_REPO_NAME"])) {
      return this.env.CI_REPO_NAME
    }
    return '';
  }

  get supportedPlatforms(): string[] { return ["github"] }
}
