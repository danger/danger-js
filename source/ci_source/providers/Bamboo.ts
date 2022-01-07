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

export class Bamboo implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "Bamboo"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["bamboo_buildPlanName", "bamboo_planRepository_repositoryUrl"])
  }

  get isPR(): boolean {
    const mustHave = ["bamboo_repository_pr_key", "bamboo_planRepository_repositoryUrl", "bamboo_buildPlanName"]
    const mustBeInts = ["bamboo_repository_pr_key"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, mustBeInts)
  }

  get pullRequestID(): string {
    return `${this.env.bamboo_repository_pr_key}`
  }

  get repoSlug(): string {
    //ssh://git@bt01.cliplister.com:7999/clfr30/bc3_complete.git
    // bamboo_inject_slug="projects/CLFR30/repos/bc3_complete" \

    const [, project, slug] = this.env.bamboo_planRepository_repositoryUrl.match(/\/(\w+)\/([a-zA-Z0-9_\.-]+(?:.git)?)$/)

    return `projects/${project}/repos/${slug.replace(/\.[^.]+$/, "")}`
  }
}
