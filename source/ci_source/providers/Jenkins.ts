import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"
/**
 *  https://jenkins-ci.org
 *
 *  ### CI Setup
 *  Ah Jenkins, so many memories. So, if you're using Jenkins, you're hosting your own  environment.
 *
 *  ### GitHub
 *  You will want to be using the
 *  [GitHub pull request builder plugin](https://wiki.jenkins-ci.org/display/JENKINS/GitHub+pull+request+builder+plugin)
 *  in order to ensure that you have the build environment set up for PR integration.
 *
 *  With that set up, you can edit your job to add `yarn danger` at the build action.
 *
 *  ### Pipeline
 * If you're using [pipelines](https://jenkins.io/solutions/pipeline/) you should be using the
 * [GitHub branch source plugin](https://wiki.jenkins-ci.org/display/JENKINS/GitHub+Branch+Source+Plugin) for easy setup and handling of PRs.
 *
 *  After you've set up the plugin, add a `sh 'yarn danger'` line in your pipeline  script and make sure that build PRs is enabled.
 *
 *  ## Token Setup
 *
 *  ### GitHub
 *  As you own the machine, it's up to you to add the environment variable for the  `DANGER_GITHUB_API_TOKEN`.
 */
export class Jenkins implements CISource {
  constructor(private readonly env: Env) {
  }

  get name(): string {
    return "Jenkins"
  }

  get isCI(): boolean {
    return ensureEnvKeysExist(this.env, ["JENKINS_URL"])
  }

  get isPR(): boolean {
    const mustHave = ["JENKINS_URL", "ghprbPullId", "ghprbGhRepository"]
    const mustBeInts = ["ghprbPullId"]
    return ensureEnvKeysExist(this.env, mustHave) && ensureEnvKeysAreInt(this.env, mustBeInts)
  }

  get pullRequestID(): string {
    return this.env.ghprbPullId
  }

  get repoSlug(): string {
    return this.env.ghprbGhRepository
  }

  get supportedPlatforms(): Array<string> {
    return ["github"]
  }
}
