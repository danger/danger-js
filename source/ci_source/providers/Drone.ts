import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"

/**
 *
 *  ### CI Setup
 *
 *  With Drone, you run the docker images yourself, so you will want to add `yarn danger` at the end of
 *  your `.drone.yml`.
 *
 *   ``` shell
 *    build:
 *      image: golang
 *        commands:
 *          - ...
 *          - yarn danger
 *   ```
 *
 *  ### Token Setup
 *
 *  As this is self-hosted, you will need to add the `DANGER_GITHUB_API_TOKEN` to your build user's ENV. The alternative
 *  is to pass in the token as a prefix to the command `DANGER_GITHUB_API_TOKEN="123" yarn danger`.
 */

export class Drone implements CISource {
  constructor(private readonly env: Env) {}

  get name(): string {
    return "Drone"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["DRONE"])
  }

  get isPR(): boolean {
    const mustHave = ["DRONE", "DRONE_PULL_REQUEST", "DRONE_REPO"]
    const mustBeInts = ["DRONE_PULL_REQUEST"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, mustBeInts)
  }

  get pullRequestID(): string {
    return this.env.DRONE_PULL_REQUEST
  }
  get repoSlug(): string {
    return this.env.DRONE_REPO
  }
  get supportedPlatforms(): string[] {
    return ["github"]
  }
}
