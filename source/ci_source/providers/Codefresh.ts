import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist } from "../ci_source_helpers"

/// Codefresh environment variables: https://codefresh.io/docs/docs/codefresh-yaml/variables/

export class Codefresh implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "Codefresh"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["CF_BUILD_ID"])
  }

  get isPR(): boolean {
    return ensureEnvKeysExist(this.env, ["CF_PULL_REQUEST_NUMBER"])
  }

  get pullRequestID(): string {
    if (this.env.CF_PULL_REQUEST_NUMBER) {
      return this.env.CF_PULL_REQUEST_NUMBER
    } else {
      return ""
    }
  }

  get repoSlug(): string {
    const owner = this.env.CF_REPO_OWNER
    const reponame = this.env.CF_REPO_NAME
    return owner && reponame ? `${owner}/${reponame}` : ""
  }

  get repoURL(): string {
    const owner = this.env.CF_REPO_OWNER
    const reponame = this.env.CF_REPO_NAME
    return owner && reponame ? `https://github.com/${owner}/${this.env.reponame}` : ""
  }

  get ciRunURL() {
    return this.env["CF_BUILD_URL"]
  }
}
