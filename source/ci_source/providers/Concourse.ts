import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

/**
 * Concourse CI Integration
 *
 * https://concourse-ci.org/
 *
 *  ### CI Setup
 *
 *  With Concourse, you run the docker images yourself, so you will want to add `yarn danger ci` within one of your build jobs.
 *
 *   ``` shell
 *    build:
 *      image: golang
 *        commands:
 *          - ...
 *          - yarn danger ci
 *   ```
 *
 *  ### Environment Variable Setup
 *
 *  As this is self-hosted, you will need to add the `CONCOURSE` environment variable `export CONCOURSE=true` to your build environment,
 *  as well as setting environment variables for `PULL_REQUEST_ID` and `REPO_SLUG`. Assuming you are using the github pull request resource
 *  https://github.com/jtarchie/github-pullrequest-resource the id of the PR can be accessed from `git config --get pullrequest.id`.
 *
 *  ### Token Setup
 *
 *  Once again as this is self-hosted, you will need to add `DANGER_GITHUB_API_TOKEN` environment variable to the build environment.
 *  The suggested method of storing the token is within the vault - https://concourse-ci.org/creds.html
 */
export class Concourse implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "Concourse"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["CONCOURSE"])
  }

  get isPR(): boolean {
    const mustHave = ["PULL_REQUEST_ID", "REPO_SLUG"]
    const mustBeInts = ["PULL_REQUEST_ID"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, mustBeInts)
  }

  get pullRequestID(): string {
    return this.env.PULL_REQUEST_ID
  }

  get repoSlug(): string {
    return this.env.REPO_SLUG
  }

  get ciRunURL() {
    return this.env.BUILD_URL
  }
}
