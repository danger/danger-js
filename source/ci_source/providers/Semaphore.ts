import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

/**
 *  ### CI Setup
 *
 *  For Semaphore you will want to go to the settings page of the project. Inside "Build Settings"
 *  you should add `yarn danger ci` to the Setup thread. Note that Semaphore only provides
 *  the build environment variables necessary for Danger on PRs across forks.
 *
 *  ### Token Setup
 *
 *  You can add your `DANGER_GITHUB_API_TOKEN` inside the "Environment Variables" section in the settings.
 *
 */
export class Semaphore implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "Semaphore"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["SEMAPHORE"])
  }

  get isPR(): boolean {
    const mustHave = ["SEMAPHORE_REPO_SLUG"]
    const mustBeInts = ["PULL_REQUEST_NUMBER"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, mustBeInts)
  }

  get pullRequestID(): string {
    return this.env.PULL_REQUEST_NUMBER
  }

  get repoSlug(): string {
    return this.env.SEMAPHORE_REPO_SLUG
  }
}
