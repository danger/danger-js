import setSharedArgs, { SharedCLI } from "./utils/sharedDangerfileArgs"

import * as chalk from "chalk"
import * as program from "commander"
import * as fs from "fs"
import * as getSTDIN from "get-stdin"

import { contextForDanger } from "../runner/Dangerfile"
import inline from "../runner/runners/inline"
import { Executor } from "../runner/Executor"
import { getPlatformForEnv } from "../platforms/platform"
import getRuntimeCISource from "./utils/getRuntimeCISource"

// Given the nature of this command, it can be tricky to test, so I use a command like this:
//
// env DANGER_GITHUB_API_TOKEN='xxx' DANGER_FAKE_CI="YEP" DANGER_TEST_REPO='artsy/eigen' DANGER_TEST_PR='2408'
//   yarn ts-node -s -- source/commands/danger-process.ts ./scripts/danger_runner.rb
//

program
  .usage("[options] dangerfile")
  .description("Handles running the Dangerfile, expects a DSL from STDIN, which should be passed from `danger run`.")

setSharedArgs(program).parse(process.argv)

const app = (program as any) as SharedCLI

const run = async (jsonString: string) => {
  const dsl = JSON.parse(jsonString)
  console.log(dsl)

  // Set up the runtime env
  const context = contextForDanger(dsl)
  const runtimeEnv = await inline.createDangerfileRuntimeEnvironment(context)
  const results = await inline.runDangerfileEnvironment(app.dangerfile, undefined, runtimeEnv)

  const config = {
    stdoutOnly: app.textOnly,
    verbose: app.verbose,
  }

  const source = await getRuntimeCISource(app)
  const platform = getPlatformForEnv(process.env, source!)

  const exec = new Executor(source!, platform, inline, config)
  await exec.handleResults(results)
}

getSTDIN().then(run)
