import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

/**
 *  ### CI Setup
 *
 *  You want to add `yarn danger ci` to your `build.sh` file to run  Danger at the
 *  end of your build.
 *
 *  ### Token Setup
 *
 *  As this is self-hosted, you will need to add the `DANGER_GITHUB_API_TOKEN` to your build user's ENV. The alternative
 *  is to pass in the token as a prefix to the command `DANGER_GITHUB_API_TOKEN="123" yarn danger ci`.
 */
export class Surf implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "surf-build"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["SURF_REPO", "SURF_NWO"])
  }

  get isPR(): boolean {
    return this.isCI
  }

  get pullRequestID(): string {
    const key = "SURF_PR_NUM"
    return ensureEnvKeysAreInt(this.env, [key]) ? this.env[key] : ""
  }

  get repoSlug(): string {
    return this.env["SURF_NWO"]
  }
}
