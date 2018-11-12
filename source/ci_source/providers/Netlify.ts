import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

/**
 * ### CI Setup
 *  1. Log in to your Netlify account and add the `DANGER_GITHUB_API_TOKEN`
 *  environment variable to your site's deploy settings.
 *  `https://app.netlify.com/sites/[site-name]/settings/deploys#build-environment-variables`.
 *
 *  2. Prepend `yarn danger ci && ` to your build command in the Netlify web UI
 *  or in your netlify.toml. For example, `yarn danger ci && yarn build`
 */
export class Netlify implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "Netlify"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["NETLIFY_BUILD_BASE"])
  }

  get isPR(): boolean {
    const mustHave = ["REVIEW_ID", "REPOSITORY_URL"]
    const mustBeInts = ["REVIEW_ID"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, mustBeInts)
  }

  get pullRequestID(): string {
    return this.env.REVIEW_ID
  }

  get repoSlug(): string {
    return this.env.REPOSITORY_URL.replace(/^https:\/\/github.com\//, "")
  }
}
