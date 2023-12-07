#! /usr/bin/env node

import setSharedArgs, { SharedCLI } from "./utils/sharedDangerfileArgs"
import nodeCleanup from "node-cleanup"

import program from "commander"
import { debug } from "../debug"
import getSTDIN from "get-stdin"
import chalk from "chalk"

import inline from "../runner/runners/inline"
import { dangerfilePath } from "./utils/fileUtils"
import { jsonToContext } from "../runner/jsonToContext"
import { DangerResults } from "../dsl/DangerResults"

import getRuntimeCISource from "./utils/getRuntimeCISource"
import { getPlatformForEnv } from "../platforms/platform"
import { tmpdir } from "os"
import { writeFileSync } from "fs"
import { join } from "path"
import { randomBytes } from "crypto"

const d = debug("runner")

// Given the nature of this command, it can be tricky to test, so I use a command like this:
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

const run = (config: SharedCLI) => async (jsonString: string) => {
  const source = (config && config.source) || (await getRuntimeCISource(config))
  const platform = getPlatformForEnv(process.env, source)

  d("Got STDIN for Danger Run")
  foundDSL = true
  clearTimeout(missingDSLTimeout)
  const dangerFile = dangerfilePath(program)

  // Set up the runtime env
  const context = await jsonToContext(jsonString, program, source)
  runtimeEnv = await inline.createDangerfileRuntimeEnvironment(context)
  d(`Evaluating ${dangerFile}`)

  // Allow platforms to hook into the runtime environment instead
  if (platform.executeRuntimeEnvironment) {
    await platform.executeRuntimeEnvironment(inline.runDangerfileEnvironment, dangerFile, runtimeEnv)
  } else {
    await inline.runDangerfileEnvironment([[dangerFile, false]], [undefined], runtimeEnv)
  }
}

// Wait till the end of the process to print out the results. Will
// only post the results when the process has succeeded, leaving the
// host process to create a message from the logs.
nodeCleanup((exitCode: number, signal: string) => {
  const results: DangerResults = runtimeEnv.results
  d(`Process has finished with ${exitCode}, sending the results back to the host process ${signal || ""}`)
  d(
    `Got md ${results.markdowns.length} w ${results.warnings.length} f ${results.fails.length} m ${results.messages.length}`
  )
  if (foundDSL) {
    const filename = `danger-results-${randomBytes(4).toString("hex")}.json`
    const resultsPath = join(tmpdir(), filename)
    d(`Writing results into ${resultsPath}`)
    writeFileSync(resultsPath, JSON.stringify(results, null, 2), "utf8")
    process.stdout.write("danger-results:/" + resultsPath)
  }
})

// Add a timeout so that CI doesn't run forever if something has broken.
const missingDSLTimeout = setTimeout(() => {
  if (!foundDSL) {
    console.error(chalk.red("Timeout: Failed to get the Danger DSL after 10 second"))
    process.exitCode = 1
    process.exit(1)
  }
}, 10000)

// Start waiting on STDIN for the DSL
getSTDIN().then(run(program as any))
