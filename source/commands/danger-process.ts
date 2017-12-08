import { ArgumentParser, SubParser } from "argparse"
import * as chalk from "chalk"

import { getPlatformForEnv } from "../platforms/platform"
import { Executor } from "../runner/Executor"
import runDangerSubprocess, { prepareDangerDSL } from "./utils/runDangerSubprocess"
import { SharedCLI, registerSharedArgs } from "./utils/sharedDangerfileArgs"
import getRuntimeCISource from "./utils/getRuntimeCISource"

import inlineRunner from "../runner/runners/inline"
import { jsonDSLGenerator } from "../runner/dslGenerator"

export interface App extends SharedCLI {
  processName: string
}

export function createParser(subparsers: SubParser): ArgumentParser {
  const parser = subparsers.addParser("process", {
    help: "Like `run` but lets another process handle evaluating a Dangerfile",
    epilog:
      "Does a Danger run, but instead of handling the execution of a Dangerfile it will pass the DSL " +
      "into another process expecting the process to eventually return results back as JSON. If you don't " +
      "provide another process, then it will output to STDOUT.",
  })
  registerSharedArgs(parser)
  parser.addArgument(["processName"], {
    metavar: "PROCESS_NAME",
    required: false,
    // help: "??",
  })
  return parser
}

// Given the nature of this command, it can be tricky to test, so I use a command like this:
//
// env DANGER_GITHUB_API_TOKEN='xxx' DANGER_FAKE_CI="YEP" DANGER_TEST_REPO='artsy/eigen' DANGER_TEST_PR='2408'
//   yarn ts-node -s -- source/commands/danger-process.ts ./scripts/danger_runner.rb
//

declare const global: any

export async function main(app: App) {
  if (process.env["DANGER_VERBOSE"] || app.verbose) {
    global.verbose = true
  }

  getRuntimeCISource(app).then(source => {
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
        const config = {
          stdoutOnly: app.textOnly,
          verbose: app.verbose,
          jsonOnly: false,
        }

        jsonDSLGenerator(platform).then(dangerJSONDSL => {
          const processInput = prepareDangerDSL(dangerJSONDSL)

          if (!app.processName) {
            //  Just pipe it out to the CLI
            process.stdout.write(processInput)
          } else {
            const exec = new Executor(source, platform, inlineRunner, config)
            runDangerSubprocess([app.processName], processInput, exec)
          }
        })
      }
    }
  })
}
