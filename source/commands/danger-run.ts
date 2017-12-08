import { ArgumentParser, SubParser } from "argparse"
import * as chalk from "chalk"

import { getPlatformForEnv } from "../platforms/platform"
import { Executor } from "../runner/Executor"
import runDangerSubprocess, { prepareDangerDSL } from "./utils/runDangerSubprocess"
import { registerSharedArgs, SharedCLI as App } from "./utils/sharedDangerfileArgs"
import getRuntimeCISource from "./utils/getRuntimeCISource"

import inlineRunner from "../runner/runners/inline"
import { jsonDSLGenerator } from "../runner/dslGenerator"
import dangerRunToRunnerCLI from "./utils/dangerRunToRunnerCLI"

export function createParser(subparsers: SubParser): ArgumentParser {
  const parser = subparsers.addParser("run", { help: "Runs danger on your local system (default)" })
  registerSharedArgs(parser)
  return parser
}

export { SharedCLI as App } from "./utils/sharedDangerfileArgs"

export async function main(app: App) {
  const source = await getRuntimeCISource(app)

  // This does not set a failing exit code
  if (source && !source.isPR) {
    console.log("Skipping Danger due to this run not executing on a PR.")
  }

  // The optimal path
  if (source && source.isPR) {
    const platform = getPlatformForEnv(process.env, source)
    if (!platform) {
      console.log(chalk.red(`Could not find a source code hosting platform for ${source.name}.`))
      console.log(
        `Currently Danger JS only supports GitHub, if you want other platforms, consider the Ruby version or help out.`
      )
      process.exitCode = 1
    }

    if (platform) {
      jsonDSLGenerator(platform).then(dangerJSONDSL => {
        const config = {
          stdoutOnly: app.textOnly,
          verbose: app.verbose,
          jsonOnly: false,
        }

        const processInput = prepareDangerDSL(dangerJSONDSL)

        const runnerCommand = dangerRunToRunnerCLI(process.argv)
        const exec = new Executor(source, platform, inlineRunner, config)
        runDangerSubprocess(runnerCommand, processInput, exec)
      })
    }
  }
}
