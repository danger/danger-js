import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

export class GitLabCI implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "GitLab CI"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["GITLAB_CI"])
  }

  get isPR(): boolean {
    const mustHave = ["CI_MERGE_REQUEST_IID", "CI_PROJECT_PATH"]
    const mustBeInts = ["CI_MERGE_REQUEST_IID"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, mustBeInts)
  }

  get pullRequestID(): string {
    return this.env.CI_MERGE_REQUEST_IID
  }

  get repoSlug(): string {
    return this.env.CI_PROJECT_PATH
  }

  get commitHash(): string {
    return this.env.CI_COMMIT_SHA
  }
}

// See https://docs.gitlab.com/ee/ci/variables/predefined_variables.html
