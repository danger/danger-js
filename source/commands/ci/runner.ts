import chalk from "chalk"
import { debug } from "../../debug"

import { getPlatformForEnv, Platform } from "../../platforms/platform"
import { Executor, ExecutorOptions } from "../../runner/Executor"
import { runDangerSubprocess } from "../utils/runDangerSubprocess"
import { SharedCLI } from "../utils/sharedDangerfileArgs"
import getRuntimeCISource from "../utils/getRuntimeCISource"

import inlineRunner from "../../runner/runners/inline"
import { jsonDSLGenerator } from "../../runner/dslGenerator"
import dangerRunToRunnerCLI from "../utils/dangerRunToRunnerCLI"
import { CISource } from "../../ci_source/ci_source"
import { readFileSync } from "fs"
import { join } from "path"

const d = debug("process_runner")

export interface RunnerConfig {
  /** The CI source that could come from the command */
  source: CISource
  /** A platform which could come for us come from the command */
  platform: Platform
  /** Additional env vars which are passed through to the subprocess */
  additionalEnvVars: object
}

export const runRunner = async (app: SharedCLI, config?: Partial<RunnerConfig>) => {
  const appPackageContent = readFileSync(join(__dirname, "../../../package.json"), "utf8")
  const { version } = JSON.parse(appPackageContent)
  d(`Debug mode on for Danger v${version}`)
  d(`Starting sub-process run`)

  const configSource = config && config.source
  const source = configSource || (await getRuntimeCISource(app))

  // This does not set a failing exit code, because it's also likely
  // danger is running on a CI run on the merge of a PR, and not just
  // the PR runs itself. This means failing CI when it's not really
  // danger's responsibility to run
  if (source && !source.isPR) {
    console.log("Skipping Danger due to this run not executing on a PR.")
  }

  // The optimal path when on a PR
  if (source && source.isPR) {
    const configPlatform = config && config.platform
    const platform = configPlatform || getPlatformForEnv(process.env, source)

    // You could have accidentally set it up on GitLab for example
    if (!platform) {
      console.log(chalk.red(`Could not find a source code hosting platform for ${source.name}.`))
      console.log(
        `Currently Danger JS only supports GitHub, BitBucket Server, Gitlab and Bitbucket Cloud, if you want other platforms, consider the Ruby version or help add support.`
      )
      process.exitCode = 1
    }

    if (platform) {
      const dangerJSONDSL = await jsonDSLGenerator(platform, source, app)
      d({ dangerJSONDSL })
      const execConfig: ExecutorOptions = {
        stdoutOnly: !platform.supportsCommenting() || app.textOnly,
        verbose: app.verbose,
        jsonOnly: false,
        dangerID: app.id || "Danger",
        passURLForDSL: app.passURLForDSL || false,
        disableGitHubChecksSupport: !app.useGithubChecks,
        failOnErrors: app.failOnErrors,
        noPublishCheck: !app.publishCheck,
      }

      const processName = (app.process && app.process.split(" ")) || undefined
      const runnerCommand = processName || dangerRunToRunnerCLI(process.argv)
      d(`Preparing to run: ${runnerCommand}`)

      // Make concrete type for the runner config with a mix of the defaults
      // and the partial config from the top
      const runConfig: RunnerConfig = {
        source,
        platform,
        additionalEnvVars: (config && config.additionalEnvVars) || {},
      }

      // Ship it
      const exec = new Executor(source, platform, inlineRunner, execConfig, process)
      runDangerSubprocess(runnerCommand, dangerJSONDSL, exec, runConfig)
    }
  }
}
