import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

/**
 * Codemagic.io CI Integration
 *
 * Environment Variables Documented: https://docs.codemagic.io/building/environment-variables/
 * Notice a bug in the docs?: https://github.com/codemagic-ci-cd/codemagic-docs
 *
 * Need support/advice? https://slack.codemagic.io/
 */
export class Codemagic implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "Codemagic"
  }

  get isCI(): boolean {
    // Codemagic developer relations confirmed this is fine to use for this purpose
    return ensureEnvKeysExist(this.env, ["FCI_BUILD_ID"])
  }

  get isPR(): boolean {
    const mustHave = ["FCI_PULL_REQUEST", "FCI_REPO_SLUG", "FCI_PROJECT_ID", "FCI_BUILD_ID"]
    const mustBeInts = ["BUILD_NUMBER", "FCI_PULL_REQUEST_NUMBER"]
    return (
      ensureEnvKeysExist(this.env, mustHave) &&
      ensureEnvKeysAreInt(this.env, mustBeInts) &&
      this.env.FCI_PULL_REQUEST === "true"
    )
  }

  get pullRequestID(): string {
    return this.env.FCI_PULL_REQUEST_NUMBER
  }

  get repoSlug(): string {
    return this.env.FCI_REPO_SLUG
  }

  get ciRunURL() {
    const { FCI_BUILD_ID, FCI_PROJECT_ID } = process.env
    return `https://codemagic.io/app/${FCI_PROJECT_ID}/build/${FCI_BUILD_ID}`
  }
}
