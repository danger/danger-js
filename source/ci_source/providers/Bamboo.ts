import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

/**
 * ### CI Setup
 *
 * Bamboo v6.9+ provides the pull request key as an environment variable if
 * the Bamboo branch is created from a pull request.
 * However, Bamboo plan branches created as a result of a new Git branch
 * (or manually) will not have this context added for Danger to utilise:
 *
 * - Go to Plan Configuration -> Branches -> Select:
 *   - Manually
 *   - [x] **When pull request is created**
 *   - When new branch in repository is created
 *   - When new branch in repository is created and matches expression
 *
 * If you would like Bamboo to process all Git branches but still have Danger
 * function on pull requests, a simple workaround is to create a separate Bamboo
 * build plan for pull requests.
 *
 * A more complicated method could be to create a script to consult your source
 * control's API for relevant pull requests based on a branch name, and then
 * invoke Danger for each by setting the `DANGER_MANUAL_CI`,
 * `DANGER_MANUAL_GH_REPO` and `DANGER_MANUAL_PR_NUM` environment variables.
 *
 * ### Token Setup
 *
 * Set the relevant environment variables for your source control system, such
 * as `DANGER_BITBUCKETSERVER_HOST`, `DANGER_BITBUCKETSERVER_USERNAME`, and
 * `DANGER_BITBUCKETSERVER_TOKEN`.
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

    const [, project, slug] = this.env.bamboo_planRepository_repositoryUrl.match(
      /\/(\w+)\/([a-zA-Z0-9_\.-]+(?:.git)?)$/
    )

    return `projects/${project}/repos/${slug.replace(/\.[^.]+$/, "")}`
  }
}
