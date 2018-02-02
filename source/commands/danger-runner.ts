#! /usr/bin/env node

import setSharedArgs from "./utils/sharedDangerfileArgs"
import * as nodeCleanup from "node-cleanup"

import * as program from "commander"
import * as debug from "debug"
import * as getSTDIN from "get-stdin"
import chalk from "chalk"

import inline from "../runner/runners/inline"
import { dangerfilePath } from "./utils/file-utils"
import { jsonToContext } from "../runner/json-to-context"

const d = debug("danger:runner")

// Given the nature of this command, it can be tricky to test, so I use a command like this:
//
// tslint:disable-next-line:max-line-length
//
// yarn build; cat source/_tests/fixtures/danger-js-pr-395.json | env DANGER_FAKE_CI="YEP" DANGER_TEST_REPO='danger/danger-js' DANGER_TEST_PR='395' node distribution/commands/danger-runner.js --text-only
//
// Which will build danger, then run just the dangerfile runner with a fixtured version of the JSON

program
  .usage("[options]")
  .description(
    "Handles running the Dangerfile, expects a DSL from STDIN, which should be passed from `danger` or danger run`. You probably don't need to use this command."
  )
  // Because other calls will trigger this one,
  // and we don't want to keep a white/blacklist
  .allowUnknownOption(true)

const argvClone = process.argv.slice(0)
setSharedArgs(program).parse(argvClone)
d(`Started Danger runner with ${program.args}`)

let foundDSL = false
let runtimeEnv = {} as any

const run = async (jsonString: string) => {
  d("Got STDIN for Danger Run")
  foundDSL = true
  const dangerFile = dangerfilePath(program)
  // Set up the runtime env
  const context = await jsonToContext(jsonString, program)
  runtimeEnv = await inline.createDangerfileRuntimeEnvironment(context)
  d(`Evaluating ${dangerFile}`)
  await inline.runDangerfileEnvironment(dangerFile, undefined, runtimeEnv)
}

// Wait till the end of the process to print out the results. Will
// only post the results when the process has succeeded, leaving the
// host process to create a message from the logs.
nodeCleanup((exitCode: number, signal: string) => {
  d(`Process has finished with ${exitCode} ${signal}, sending the results back to the host process`)
  if (foundDSL) {
    process.stdout.write(JSON.stringify(runtimeEnv.results, null, 2))
  }
})

// Add a timeout so that CI doesn't run forever if something has broken.
setTimeout(() => {
  if (!foundDSL) {
    console.error(chalk.red("Timeout: Failed to get the Danger DSL after 1 second"))
    process.exitCode = 1
    process.exit(1)
  }
}, 1000)

// Start waiting on STDIN for the DSL
getSTDIN().then(run)
