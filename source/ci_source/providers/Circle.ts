import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

/**
 *  ### CI Setup
 *
 *  For setting up Circle CI, we recommend turning on "Only Build pull requests." in "Advanced Setting." Without this enabled,
 *  it is _really_ tricky for Danger to know whether you are in a pull request or not, as the environment metadata
 *  isn't reliable. This may be different with Circle v2.
 *
 *  With that set up, you can you add `yarn danger` to your `circle.yml`. If you override the default
 *  `test:` section, then add it as an extra step. Otherwise add a new `pre` section to the test:
 *
 *    ``` ruby
 *    test:
 *      override:
 *          - yarn danger
 *    ```
 *
 *  ### Token Setup
 *
 *  There is no difference here for OSS vs Closed, add your `DANGER_GITHUB_API_TOKEN` to the Environment variable settings page.
 *
 */
export class Circle implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "Circle CI"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["CIRCLE_BUILD_NUM"])
  }

  get isPR(): boolean {
    if (ensureEnvKeysExist(this.env, ["CI_PULL_REQUEST"]) || ensureEnvKeysExist(this.env, ["CIRCLE_PULL_REQUEST"])) {
      return true
    }

    const mustHave = ["CIRCLE_CI_API_TOKEN", "CIRCLE_PROJECT_USERNAME", "CIRCLE_PROJECT_REPONAME", "CIRCLE_BUILD_NUM"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, ["CIRCLE_PR_NUMBER"])
  }

  private _prParseURL(): { owner?: string; reponame?: string; id?: string } {
    const prUrl = this.env.CI_PULL_REQUEST || this.env.CIRCLE_PULL_REQUEST || ""
    const splitSlug = prUrl.split("/")
    if (splitSlug.length === 7) {
      const owner = splitSlug[3]
      const reponame = splitSlug[4]
      const id = splitSlug[6]
      return { owner, reponame, id }
    }
    return {}
  }

  get pullRequestID(): string {
    if (this.env.CIRCLE_PR_NUMBER) {
      return this.env.CIRCLE_PR_NUMBER
    } else {
      const { id } = this._prParseURL()
      return id || ""
    }
  }

  get repoSlug(): string {
    const { owner, reponame } = this._prParseURL()
    return owner && reponame ? `${owner}/${reponame}` : ""
  }

  get repoURL(): string {
    return this.env.CIRCLE_REPOSITORY_URL
  }

  get supportedPlatforms(): string[] {
    return ["github"]
  }

  get ciRunURL() {
    return this.env["CIRCLE_BUILD_URL"]
  }
}
