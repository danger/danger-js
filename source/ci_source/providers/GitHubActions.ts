import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist } from "../ci_source_helpers"
import { readFileSync, existsSync } from "fs"

// [unsure the docs url yet]

/**
 * ### CI Setup
 *
 * To use Danger JS with GitHub Actions, you'll need want to set up
 * Danger to run on a `pull_request` webhook. To do this, you'll need
 * to add/amend your repo's workflow file with something like:
 *
 * ```
 * workflow "Dangerfile JS Eval" {
 *   on = "pull_request"
 *   resolves = "Danger JS"
 * }
 *
 * action "Danger JS" {
 *   uses = "danger/danger-js"
 *   secrets = ["GITHUB_TOKEN"]
 * }
 * ```
 *
 * You can pass additional CLI to Danger JS in an action via:
 *
 * ```
 * action "Danger JS" {
 *   [...]
 *   args = "--dangerfile artsy/peril-settings/org/allPRs.ts"
 * }
 * ```
 *
 * This runs the file [`org/allPRs.ts`](https://github.com/artsy/peril-settings/blob/master/org/allPRs.ts)
 * from the repo [artsy/peril-settings](https://github.com/artsy/peril-settings).
 *
 * ### Token Setup
 *
 * You need to make sure that the secret `"GITHUB_TOKEN"` is
 * enabled in your workspace. This is so that Danger can connect
 * to GitHub.
 *
 * ```
 * action "Danger JS" {
 *   uses = "danger/danger-js"
 *   secrets = ["GITHUB_TOKEN"]
 * }
 * ```
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

  get useEventDSL() {
    // Support event based PR runs
    return this.env.GITHUB_EVENT_NAME !== "pull_request"
  }

  get pullRequestID(): string {
    if (this.env.GITHUB_EVENT_NAME === "pull_request") {
      return this.event.pull_request.number
    }

    throw new Error("pullRequestID was called on GitHubActions when it wasn't a PR")
  }

  get repoSlug(): string {
    if (this.env.GITHUB_EVENT_NAME === "pull_request") {
      return this.event.pull_request.base.repo.full_name
    }

    throw new Error("repoSlug was called on GitHubActions when it wasn't a PR")
  }

  // I made a request for this
  // get ciRunURL() {
  //   return process.env.BUILD_URL
  // }
}
