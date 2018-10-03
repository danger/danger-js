import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist } from "../ci_source_helpers"
import { readFileSync, existsSync } from "fs"

// [unsure the docs url yet]

/**
 * ### CI Setup
 *
 * [TODO] workspace file etc
 *
 * ### Token Setup
 *
 * There is no token setup needed
 *
 *
 */

export class GitHubActions implements CISource {
  private event: any

  constructor(private readonly env: Env) {
    if (existsSync("/github/workflow/event.json")) {
      const event = readFileSync("/github/workflow/event.json", "utf8")
      this.event = JSON.parse(event)
    }
  }

  get name(): string {
    return "GitHub Actions"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["GITHUB_WORKFLOW"])
  }

  get isPR(): boolean {
    // This one is complicated, because it needs to not *just* support PRs
    return true
  }

  get supportsSkippingPRDSL() {
    return true
  }

  get pullRequestID(): string {
    if (this.env.GITHUB_EVENT === "pull_request") {
      return this.event.pull_request.number
    }

    throw new Error("pullRequestID was called on GitHubActions when it wasn't a PR")
  }

  get repoSlug(): string {
    if (this.env.GITHUB_EVENT === "pull_request") {
      return this.event.pull_request.base.repo.full_name
    }

    throw new Error("repoSlug was called on GitHubActions when it wasn't a PR")
  }

  // I made a request for this
  // get ciRunURL() {
  //   return process.env.BUILD_URL
  // }
}
