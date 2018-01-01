import chalk from "chalk"
import * as debug from "debug"

import { getPlatformForEnv, Platform } from "../../platforms/platform"
import { Executor, ExecutorOptions } from "../../runner/Executor"
import runDangerSubprocess, { prepareDangerDSL } from "../utils/runDangerSubprocess"
import { SharedCLI } from "../utils/sharedDangerfileArgs"
import getRuntimeCISource from "../utils/getRuntimeCISource"

import inlineRunner from "../../runner/runners/inline"
import { jsonDSLGenerator } from "../../runner/dslGenerator"
import dangerRunToRunnerCLI from "../utils/dangerRunToRunnerCLI"
import { CISource } from "../../ci_source/ci_source"

const d = debug("danger:process_runner")

export interface RunnerConfig {
  source: CISource
  platform: Platform
}

export const runRunner = async (app: SharedCLI, config?: RunnerConfig) => {
  d(`Starting sub-process run with ${app.args}`)
  const source = (config && config.source) || (await getRuntimeCISource(app))

  // This does not set a failing exit code
  if (source && !source.isPR) {
    console.log("Skipping Danger due to this run not executing on a PR.")
  }

  // The optimal path
  if (source && source.isPR) {
    const platform = (config && config.platform) || getPlatformForEnv(process.env, source)
    if (!platform) {
      console.log(chalk.red(`Could not find a source code hosting platform for ${source.name}.`))
      console.log(
        `Currently Danger JS only supports GitHub, if you want other platforms, consider the Ruby version or help out.`
      )
      process.exitCode = 1
    }

    if (platform) {
      const dangerJSONDSL = await jsonDSLGenerator(platform)

      const config: ExecutorOptions = {
        stdoutOnly: app.textOnly,
        verbose: app.verbose,
        jsonOnly: false,
        dangerID: app.id || "default",
      }

      const processInput = prepareDangerDSL(dangerJSONDSL)

      const runnerCommand = dangerRunToRunnerCLI(process.argv)
      d(`Preparing to run: ${runnerCommand}`)

      const exec = new Executor(source, platform, inlineRunner, config)
      runDangerSubprocess(runnerCommand, processInput, exec)
    }
  }
}
