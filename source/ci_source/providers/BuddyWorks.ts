import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"
/**
 * ### CI Setup
 *
 * To make Danger run:
 *
 * - Create a new pipeline named, DangerJS, which is triggered on every push
 * - Add a NodeJS environment as an Action
 * - Go into it, head over to the bash editor and type the following
 *    - `yarn install && yarn danger ci`
 *    - or your npm script
 * - Set the `DANGER_GITHUB_API_TOKEN` at the Variables section
 * - You're done 🎉
 *
 */
export class BuddyWorks implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "Buddy.works"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["BUDDY_PIPELINE_ID"])
  }

  get isPR(): boolean {
    const mustHave = ["BUDDY_PIPELINE_ID", "BUDDY_EXECUTION_PULL_REQUEST_ID", "BUDDY_REPO_SLUG"]
    const mustBeInts = ["BUDDY_EXECUTION_PULL_REQUEST_ID"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, mustBeInts)
  }

  get pullRequestID(): string {
    return this.env.BUDDY_EXECUTION_PULL_REQUEST_ID
  }

  get repoSlug(): string {
    return this.env.BUDDY_REPO_SLUG
  }

  get ciRunURL() {
    return this.env.BUDDY_EXECUTION_URL
  }
}

// Default ENV vars provided by Buddy.works
// https://buddy.works/docs/pipelines/environment-variables#default-environment-variables
