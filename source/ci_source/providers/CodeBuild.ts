import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist } from "../ci_source_helpers"

/**
 * CI Setup
 *
 * In CodeBuild, make sure to correctly forward CODEBUILD_BUILD_ID, CODEBUILD_SOURCE_VERSION, CODEBUILD_SOURCE_REPO_URL and DANGER_GITHUB_API_TOKEN.
 *
 * Token Setup
 *
 * Add your `DANGER_GITHUB_API_TOKEN` to your project. Edit -> Environment -> Additional configuration -> Create a parameter
 *
 */
export class CodeBuild implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "CodeBuild"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["CODEBUILD_BUILD_ID"])
  }

  get isPR(): boolean {
    const mustHave = ["CODEBUILD_BUILD_ID", "CODEBUILD_SOURCE_VERSION", "CODEBUILD_SOURCE_REPO_URL"]
    return ensureEnvKeysExist(this.env, mustHave) && this._isPRRequest()
  }

  get pullRequestID(): string {
    return this.env.CODEBUILD_SOURCE_VERSION.split("/")[1]
  }

  get repoSlug(): string {
    return this._prParseUrl()
  }

  get repoURL(): string {
    return this.env.CODEBUILD_SOURCE_REPO_URL
  }

  private _isPRRequest(): boolean {
    const isPRSource = this.env.CODEBUILD_SOURCE_VERSION.split("/")[0] === "pr" ? true : false
    const isPRIdInt = !isNaN(parseInt(this.env.CODEBUILD_SOURCE_VERSION.split("/")[1]))
    return isPRSource && isPRIdInt
  }

  private _prParseUrl(): string {
    const prUrl = this.env.CODEBUILD_SOURCE_REPO_URL || ""
    const regexp = new RegExp("([/:])([^/]+/[^/.]+)(?:.git)?$")
    const matches = prUrl.match(regexp)
    return matches ? matches[2] : ""
  }
}
