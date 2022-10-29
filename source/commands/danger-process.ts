#! /usr/bin/env node

import chalk from "chalk"
import program from "commander"

import { getPlatformForEnv } from "../platforms/platform"
import { Executor, ExecutorOptions } from "../runner/Executor"
import runDangerSubprocess, { prepareDangerDSL } from "./utils/runDangerSubprocess"
import setSharedArgs, { SharedCLI } from "./utils/sharedDangerfileArgs"
import getRuntimeCISource from "./utils/getRuntimeCISource"

import inlineRunner from "../runner/runners/inline"
import { jsonDSLGenerator } from "../runner/dslGenerator"

import { debug } from "../debug"
import { RunnerConfig } from "./ci/runner"
const d = debug("process")

// Given the nature of this command, it can be tricky to test, so I use a command like this:
//
// env DANGER_GITHUB_API_TOKEN='xxx' DANGER_FAKE_CI="YEP" DANGER_TEST_REPO='artsy/eigen' DANGER_TEST_PR='2408'
//   yarn ts-node -s -- source/commands/danger-process.ts ./scripts/danger_runner.rb
//

declare const global: any

let subprocessName: string | undefined
let deprecationWarning = chalk.bold("Semi-deprecated, as ci/pr/local all support --process")

program
  .usage("[options] <process_name>")
  .description(
    deprecationWarning +
      "\n\nDoes a Danger run, but instead of handling the execution of a Dangerfile it will pass the DSL " +
      "into another process expecting the process to eventually return results back as JSON. If you don't " +
      "provide another process, then it will output to STDOUT."
  )
  .on("--help", () => {
    console.log("\n")
    console.log("  Docs:")
    console.log("")
    console.log("    -> Danger Process:")
    console.log("       http://danger.systems/js/usage/danger-process.html")
  })
  .allowUnknownOption(true)

setSharedArgs(program)
program.action(process_name => (subprocessName = process_name)).parse(process.argv)

// The dynamic nature of the program means typecasting a lot
// use this to work with dynamic properties
const app = program as any as SharedCLI

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
        `Platform '${source.name}' is not supported with Danger JS, if you want other platforms, consider the Ruby version or help out.`
      )
      process.exitCode = 1
    }

    if (platform) {
      jsonDSLGenerator(platform, source, app).then(dangerJSONDSL => {
        if (!subprocessName) {
          //  Just pipe it out to the CLI
          const processInput = prepareDangerDSL(dangerJSONDSL)
          process.stdout.write(processInput)
        } else {
          d(`Sending input To ${subprocessName}: `, dangerJSONDSL)

          const runConfig: RunnerConfig = {
            source,
            platform,
            additionalEnvVars: {},
          }

          const execConfig: ExecutorOptions = {
            stdoutOnly: app.textOnly,
            verbose: app.verbose,
            jsonOnly: false,
            dangerID: app.id || "Danger",
            passURLForDSL: app.passURLForDSL || false,
            disableGitHubChecksSupport: !app.useGithubChecks,
            failOnErrors: app.failOnErrors,
            ignoreOutOfDiffComments: app.ignoreOutOfDiffComments,
          }

          d("Exec config: ", execConfig)
          d("Run config: ", runConfig)

          const exec = new Executor(source, platform, inlineRunner, execConfig, process)
          runDangerSubprocess([subprocessName], dangerJSONDSL, exec, runConfig)
        }
      })
    }
  }
})
