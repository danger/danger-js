import chalk from "chalk"
import { debug } from "../../debug"

import { getPlatformForEnv } from "../../platforms/platform"
import { SharedCLI } from "../utils/sharedDangerfileArgs"
import getRuntimeCISource from "../utils/getRuntimeCISource"

import { RunnerConfig } from "./runner"

const d = debug("reset-status")

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
      await platform.updateStatus("pending", "Danger is waiting for your CI run to complete...", undefined, app.id)
    }
  }
}
