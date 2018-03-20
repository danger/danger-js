import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist } from "../ci_source_helpers"

/**
 *
 * ### CI Setup
 *
 * You need to add `DANGER_GITHUB_API_TOKEN` to the ENV for the build or machine manually.
 * Then you also need to figure out how to provide the URL for the pull request in `PULL_REQUEST_URL` ENV.
 *
 * TeamCity provides the `%teamcity.build.branch%` variable that contains something like `pull/123` that you can use:
 * ```sh
 * PULL_REQUEST_URL='https://github.com/dager/danger-js/%teamcity.build.branch%'
 * ```
 *
 */

export class TeamCity implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "TeamCity"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["TEAMCITY_VERSION"])
  }

  get isPR(): boolean {
    if (ensureEnvKeysExist(this.env, ["PULL_REQUEST_URL"])) {
      return true
    }

    const mustHave = ["PULL_REQUEST_URL"]
    return ensureEnvKeysExist(this.env, mustHave)
  }

  private _prParseURL(): { owner?: string; reponame?: string; id?: string } {
    const prUrl = this.env.PULL_REQUEST_URL || ""
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
    const { id } = this._prParseURL()
    return id || ""
  }

  get repoSlug(): string {
    const { owner, reponame } = this._prParseURL()
    return owner && reponame ? `${owner}/${reponame}` : ""
  }
}
