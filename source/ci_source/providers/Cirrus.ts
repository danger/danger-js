import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

export class Cirrus implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "Cirrus CI"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["CIRRUS_CI"])
  }

  get isPR(): boolean {
    const mustHave = ["CIRRUS_CI", "CIRRUS_PR", "CIRRUS_REPO_FULL_NAME"]
    const mustBeInts = ["CIRRUS_PR"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, mustBeInts)
  }

  get pullRequestID(): string {
    return this.env.CIRRUS_PR
  }

  get repoSlug(): string {
    return this.env.CIRRUS_REPO_FULL_NAME
  }

  get ciRunURL() {
    return `https://cirrus-ci.com/task/${this.env.CIRRUS_TASK_ID}`
  }
}
