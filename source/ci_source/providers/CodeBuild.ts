import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, getPullRequestIDForBranch } from "../ci_source_helpers"

/**
 * CI Setup
 *
 * In CodeBuild, make sure to correctly forward CODEBUILD_BUILD_ID, CODEBUILD_SOURCE_VERSION, CODEBUILD_SOURCE_REPO_URL and DANGER_GITHUB_API_TOKEN.
 *
 * Token Setup
 *
 * Add your `DANGER_GITHUB_API_TOKEN` to your project. Edit -> Environment -> Additional configuration -> Create a parameter
 *
 * Note that currently, there seems to be no totally reliable way to get the branch
 * name from CodeBuild. Sometimes `CODEBUILD_SOURCE_VERSION` contains the
 * PR number in the format pr/123, but not always. Other times it may contain
 * a commit hash. `CODEBUILD_WEBHOOK_TRIGGER` will contain the pr number on the
 * same format, but only for the first event, for subsequent events it should
 * contain the branch number in the format branch/my-branch. So here we attempt
 * to determine the PR number from one of the environment variables and if
 * unsuccessful fall back to calling the API to find the PR for the branch.
 */
export class CodeBuild implements CISource {
  private default = { prID: "0" }
  constructor(private readonly env: Env) {}

  async setup(): Promise<any> {
    const prID = await this._getPrId()
    this.default.prID = prID.toString()
  }

  get name(): string {
    return "CodeBuild"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["CODEBUILD_BUILD_ID"])
  }

  get isPR(): boolean {
    const mustHave = ["CODEBUILD_BUILD_ID", "CODEBUILD_SOURCE_REPO_URL"]
    return ensureEnvKeysExist(this.env, mustHave) && this._isPRRequest()
  }

  get pullRequestID(): string {
    return this.default.prID
  }

  get repoSlug(): string {
    return this._prParseUrl()
  }

  get repoURL(): string {
    return this.env.CODEBUILD_SOURCE_REPO_URL
  }

  private _isPRRequest(): boolean {
    return this.default.prID !== "0"
  }

  private _prParseUrl(): string {
    const prUrl = this.env.CODEBUILD_SOURCE_REPO_URL || ""
    const regexp = new RegExp("([/:])([^/]+/[^/.]+)(?:.git)?$")
    const matches = prUrl.match(regexp)
    return matches ? matches[2] : ""
  }

  private async _getPrId(): Promise<string> {
    const sourceParts = (this.env.CODEBUILD_SOURCE_VERSION || "").split("/")
    const triggerParts = this.env.CODEBUILD_WEBHOOK_TRIGGER || ""

    const branchName = triggerParts.startsWith("branch/") ? triggerParts.replace("branch/", "") : null
    let prId = sourceParts[0] === "pr" ? sourceParts[1] : null

    if (!prId) {
      prId = triggerParts.startsWith("pr/") ? triggerParts.replace("pr/", "") : null
    }

    if (!prId && branchName) {
      prId = await getPullRequestIDForBranch(this, this.env, branchName)
    }

    if (isNaN(parseInt(prId))) {
      return "0"
    }

    return prId
  }
}
