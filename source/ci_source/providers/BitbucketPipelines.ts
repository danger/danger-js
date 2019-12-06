import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

/**
 * ### CI Setup
 *
 * Install dependencies and add a danger step to your `bitbucket-pipelines.yml`.
 * For improving the performance, you may need to cache `node_modules`.
 *
 * ```yml
 * image: node:10.15.0
 * pipelines:
 *   pull-requests:
 *     "**":
 *       - step:
 *           caches:
 *             - node
 *           script:
 *             - export LANG="C.UTF-8"
 *             - yarn install
 *             - yarn danger ci
 * definitions:
 *   caches:
 *     node: node_modules
 * ```
 *
 * ### Token Setup
 *
 * You can either add `DANGER_BITBUCKETCLOUD_USERNAME`, `DANGER_BITBUCKETCLOUD_PASSWORD`
 * or add `DANGER_BITBUCKETCLOUD_OAUTH_KEY`, `DANGER_BITBUCKETCLOUD_OAUTH_SECRET`
 * -
 */

export class BitbucketPipelines implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "bitbucketPipelines"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["BITBUCKET_BUILD_NUMBER"])
  }

  get isPR(): boolean {
    const mustHave = ["BITBUCKET_GIT_HTTP_ORIGIN", "BITBUCKET_REPO_OWNER", "BITBUCKET_REPO_SLUG"]
    const mustBeInts = ["BITBUCKET_PR_ID"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, mustBeInts)
  }

  get pullRequestID(): string {
    return this.env.BITBUCKET_PR_ID
  }

  get repoSlug(): string {
    return `${this.env.BITBUCKET_REPO_FULL_NAME}`
  }

  get repoURL(): string {
    return this.env.BITBUCKET_GIT_HTTP_ORIGIN
  }
}
