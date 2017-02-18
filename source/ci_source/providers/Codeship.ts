import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, getPullRequestIDForBranch } from "../ci_source_helpers"

export class Codeship implements CISource {
  private default = { prid: "0" }
  constructor(private readonly env: Env) {
  }

  async setup(): Promise<any> {
    const prid = await getPullRequestIDForBranch(this, this.env, this.branchName)
    this.default.prid = prid.toString()
  }

  get name(): string { return "Codeship" }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["CODESHIP"])
  }

  get isPR(): boolean {
    return this.pullRequestID !== "0"
  }

  get pullRequestID(): string {
    return this.default.prid
  }

  get repoSlug(): string {
    if (ensureEnvKeysExist(this.env, ["CI_REPO_NAME"])) {
      return this.env.CI_REPO_NAME
    }
    return ""
  }

  get supportedPlatforms(): string[] { return ["github"] }

  private get branchName(): string {
    return this.env.CI_BRANCH
  }
}
