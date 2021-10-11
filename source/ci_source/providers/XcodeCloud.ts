import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist } from "../ci_source_helpers"

/**
 * ### CI Setup
 *
 * Install dependencies and add a danger step to the custom build scripts.
 * See the Xcode Cloud documentation [here](https://developer.apple.com/documentation/xcode/writing-custom-build-scripts)
 *
 * ### Token Setup
 *
 * Setup the acesss token (for github `DANGER_GITHUB_API_TOKEN`) environment variable for your workflow.
 * See the Xcode Cloud documentation [here](https://developer.apple.com/documentation/xcode/xcode-cloud-workflow-reference#Custom-Environment-Variables)
 */
export class XcodeCloud implements CISource {
  constructor(private readonly env: Env) { }

  get name(): string {
    return "Xcode Cloud"
  }

  get isCI(): boolean {
    const mustHave = ["CI", "CI_XCODEBUILD_ACTION"]
    return (
      ensureEnvKeysExist(this.env, mustHave) &&
      this.env.CI == "TRUE"
    )
  }

  get isPR(): boolean {
    const mustHave = ["CI_PULL_REQUEST_NUMBER", "CI_PULL_REQUEST_TARGET_REPO"]
    return ensureEnvKeysExist(this.env, mustHave)
  }

  get repoSlug(): string {
    return this.env.CI_PULL_REQUEST_TARGET_REPO
  }

  get pullRequestID(): string {
    return this.env.CI_PULL_REQUEST_NUMBER
  }

  get commitHash(): string {
    return this.env.CI_COMMIT
  }
}
