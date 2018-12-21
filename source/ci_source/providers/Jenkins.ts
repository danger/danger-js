import { Env, CISource } from "../ci_source"
import { ensureEnvKeysExist, ensureEnvKeysAreInt } from "../ci_source_helpers"
import { pullRequestParser } from "../../platforms/pullRequestParser"

// https://jenkins.io/
// https://wiki.jenkins.io/display/JENKINS/Building+a+software+project#Buildingasoftwareproject-belowJenkinsSetEnvironmentVariables

/**
 * ### CI Setup
 * Ah Jenkins, so many memories. So, if you're using Jenkins, you're hosting your own environment.
 *
 * ### GitHub
 * You will want to be using the
 * [GitHub pull request builder plugin](https://wiki.jenkins.io/display/JENKINS/GitHub+pull+request+builder+plugin)
 * in order to ensure that you have the build environment set up for PR integration.
 *
 * ### BitBucket Server
 * If using Bitbucket Server, ensure you are using Multibranch Pipelines or Organization Folders.
 * Danger will respect the `CHANGE_URL` and `CHANGE_ID` environment variables.
 *
 * With that set up, you can edit your job to add `[run_command]` at the build action.
 *
 * ### Pipeline
 * If you're using [pipelines](https://jenkins.io/solutions/pipeline/) you should be using the
 * [GitHub branch source plugin](https://wiki.jenkins.io/display/JENKINS/GitHub+Branch+Source+Plugin) for easy setup and handling of PRs.
 *
 * After you've set up the plugin, add a `sh '[run_command]'` line in your pipeline script and make sure that build PRs is enabled.
 *
 * ## Token Setup
 *
 * ### GitHub
 * As you own the machine, it's up to you to add the environment variable for the code review platform.
 */
export class Jenkins implements CISource {
  constructor(private readonly env: Env) {}

  private isJenkins() {
    return ensureEnvKeysExist(this.env, ["JENKINS_URL"])
  }

  get name(): string {
    return "Jenkins"
  }

  get isCI(): boolean {
    return this.isJenkins()
  }

  get isPR(): boolean {
    const isGitHubPR =
      ensureEnvKeysExist(this.env, ["ghprbPullId", "ghprbGhRepository"]) &&
      ensureEnvKeysAreInt(this.env, ["ghprbPullId"])
    const isMultiBranchPR =
      ensureEnvKeysExist(this.env, ["CHANGE_ID", "CHANGE_URL"]) && ensureEnvKeysAreInt(this.env, ["CHANGE_ID"])

    return this.isJenkins() && (isMultiBranchPR || isGitHubPR)
  }

  get pullRequestID(): string {
    return this.env.ghprbPullId || this.env.CHANGE_ID
  }

  get repoSlug(): string {
    if (this.env.CHANGE_URL) {
      const result = pullRequestParser(this.env.CHANGE_URL)
      if (!result) {
        throw new Error(`Unable to get repository path from $CHANGE_URL`)
      }

      return result.repo
    }
    return this.env.ghprbGhRepository
  }

  get ciRunURL() {
    return process.env.RUN_DISPLAY_URL || process.env.BUILD_URL
  }
}
