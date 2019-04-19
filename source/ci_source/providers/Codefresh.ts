import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

/**
 *  ### CI Setup
 *
 *  To set up Danger on Codefresh, create a freestyle step in your Codefresh yaml configuration:
 *
 *  ```yml
 *  Danger:
 *    title: Run Danger
 *    image: node:latest
 *    working_directory: ${{main_clone}}
 *    entry_point: '/bin/bash'
 *    cmd:
 *      - '-ce'
 *      - |
 *        npm install -g yarn
 *        yarn add danger --dev
 *        yarn danger ci --failOnErrors
 *    when:
 *      steps:
 *        - name: main_clone
 *          on:
 *            - success
 *  ```
 *
 *  The `failOnErrors` option is required in order to ensure that the step fails properly when Danger fails. If you don't wnat this behavior, you can remove this option.
 *
 *  Don't forget to add the `DANGER_GITHUB_API_TOKEN` variable to your pipeline settings so that Danger can properly post comments to your pull request.
 *
 */

export class Codefresh implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "Codefresh"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["CF_BUILD_ID", "CF_BUILD_URL"])
  }

  get isPR(): boolean {
    return (
      ensureEnvKeysExist(this.env, ["CF_PULL_REQUEST_NUMBER"]) &&
      ensureEnvKeysAreInt(this.env, ["CF_PULL_REQUEST_NUMBER"])
    )
  }

  get pullRequestID(): string {
    if (this.env.CF_PULL_REQUEST_NUMBER) {
      return this.env.CF_PULL_REQUEST_NUMBER
    } else {
      return ""
    }
  }

  get repoSlug(): string {
    const owner = this.env.CF_REPO_OWNER
    const reponame = this.env.CF_REPO_NAME
    return owner && reponame ? `${owner}/${reponame}` : ""
  }

  get ciRunURL() {
    return this.env.CF_BUILD_URL
  }
}
