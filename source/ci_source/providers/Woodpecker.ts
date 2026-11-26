import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

/**
 *
 *  ### CI Setup
 *
 *  Add a step that runs `[run_command]` on pull request events to your Woodpecker workflow, for example in
 *  `.woodpecker/danger.yaml`.
 *
 *   ``` yaml
 *    when:
 *      event: pull_request
 *
 *    steps:
 *      - name: danger
 *        image: node:22
 *        environment:
 *          DANGER_GITHUB_API_TOKEN:
 *            from_secret: danger_github_api_token
 *        commands:
 *          - yarn install
 *          - [run_command]
 *   ```
 *
 *  ### Token Setup
 *
 *  Store the API token for your forge as a Woodpecker secret and expose it to the step with `from_secret`, as above.
 *  Use `DANGER_GITHUB_API_TOKEN` for GitHub, or `DANGER_GITLAB_API_TOKEN` (and `DANGER_GITLAB_HOST` for a
 *  self-hosted instance) for GitLab.
 */

export class Woodpecker implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "Woodpecker"
  }

  get isCI(): boolean {
    return this.env.CI === "woodpecker"
  }

  get isPR(): boolean {
    const mustHave = ["CI_COMMIT_PULL_REQUEST", "CI_REPO"]
    const mustBeInts = ["CI_COMMIT_PULL_REQUEST"]
    return this.isCI && ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, mustBeInts)
  }

  get pullRequestID(): string {
    return this.env.CI_COMMIT_PULL_REQUEST
  }

  get repoSlug(): string {
    return this.env.CI_REPO
  }

  get commitHash(): string {
    return this.env.CI_COMMIT_SHA
  }

  get ciRunURL(): string {
    return this.env.CI_PIPELINE_URL
  }
}
