import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"
/**
 * ### CI Setup
 *  You need to edit your `.travis.yml` to include `yarn danger`. If you already have
 *  a `script:` section then we recommend adding this command at the end of the script step: `- yarn danger`.
 *
 *   Otherwise, add a `before_script` step to the root of the `.travis.yml` with `yarn danger`
 *
 *   ```ruby
 *     before_script:
 *       - yarn danger
 *   ```
 *
 *  Adding this to your `.travis.yml` allows Danger to fail your build, both on the TravisCI website and within your Pull Request.
 *  With that set up, you can edit your job to add `yarn danger` at the build action.
 *
 *  ### Token Setup
 *
 *  You need to add the `DANGER_GITHUB_API_TOKEN` environment variable, to do this,
 *  go to your repo's settings, which should look like: `https://travis-ci.org/[user]/[repo]/settings`.
 *
 *  If you have an open source project, you should ensure "Display value in build log" enabled, so that PRs from forks work.
 */
export class Travis implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "Travis CI"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["HAS_JOSH_K_SEAL_OF_APPROVAL"])
  }

  get isPR(): boolean {
    const mustHave = ["HAS_JOSH_K_SEAL_OF_APPROVAL", "TRAVIS_PULL_REQUEST", "TRAVIS_REPO_SLUG"]
    const mustBeInts = ["TRAVIS_PULL_REQUEST"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, mustBeInts)
  }

  get pullRequestID(): string {
    return this.env.TRAVIS_PULL_REQUEST
  }
  get repoSlug(): string {
    return this.env.TRAVIS_REPO_SLUG
  }
  get supportedPlatforms(): string[] {
    return ["github"]
  }
}
