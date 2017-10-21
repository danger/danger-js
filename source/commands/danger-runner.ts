import setSharedArgs, { SharedCLI } from "./utils/sharedDangerfileArgs"

import * as program from "commander"
import * as getSTDIN from "get-stdin"

import { contextForDanger } from "../runner/Dangerfile"
import inline from "../runner/runners/inline"
import { Executor } from "../runner/Executor"
import { getPlatformForEnv } from "../platforms/platform"
import getRuntimeCISource from "./utils/getRuntimeCISource"
import { dangerfilePath } from "./utils/file-utils"
import { DangerDSLJSONType } from "../dsl/DangerDSL"
import { jsonToDSL } from "../runner/jsonToDSL"

// Given the nature of this command, it can be tricky to test, so I use a command like this:
//
// tslint:disable-next-line:max-line-length
// yarn build; cat source/_tests/fixtures/danger-js-pr-395.json | env DANGER_FAKE_CI="YEP" DANGER_TEST_REPO='danger/danger-js' DANGER_TEST_PR='395' node distribution/commands/danger-runner.js --text-only
//
// Which will build danger, then run just the dangerfile runner with a fixtured version of the JSON

program
  .usage("[options] dangerfile")
  .description("Handles running the Dangerfile, expects a DSL from STDIN, which should be passed from `danger run`.")

setSharedArgs(program).parse(process.argv)

const app = (program as any) as SharedCLI

const run = async (jsonString: string) => {
  const dslJSON = JSON.parse(jsonString) as { danger: DangerDSLJSONType }
  const dsl = await jsonToDSL(dslJSON.danger)
  const dangerFile = dangerfilePath(program)

  // Set up the runtime env
  const context = contextForDanger(dsl)
  const runtimeEnv = await inline.createDangerfileRuntimeEnvironment(context)
  const results = await inline.runDangerfileEnvironment(dangerFile, undefined, runtimeEnv)

  const config = {
    stdoutOnly: app.textOnly,
    jsonOnly: true,
    verbose: app.verbose,
  }

  const source = await getRuntimeCISource(app)
  const platform = getPlatformForEnv(process.env, source!)

  const exec = new Executor(source!, platform, inline, config)
  await exec.handleResults(results)
}

getSTDIN().then(run)
