import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist } from "../ci_source_helpers"
import { pullRequestParser } from "../../platforms/pullRequestParser"

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

  get pullRequestID(): string {
    const parts = pullRequestParser(this.env.PULL_REQUEST_URL || "")

    if (parts === null) {
      return ""
    }

    return parts.pullRequestNumber
  }

  get repoSlug(): string {
    const parts = pullRequestParser(this.env.PULL_REQUEST_URL || "")

    if (parts === null) {
      return ""
    }

    return parts.repo
  }
}
