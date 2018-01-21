import * as fs from "fs"

import * as debug from "debug"
import * as _require from "require-from-string"

import { DangerResults, DangerRuntimeContainer } from "../../dsl/DangerResults"
import { DangerContext } from "../../runner/Dangerfile"

import { DangerRunner } from "./runner"

import compile from "./utils/transpiler"
import cleanDangerfile from "./utils/cleanDangerfile"
import resultsForCaughtError from "./utils/resultsForCaughtError"

const d = debug("danger:inline_runner")

/**
 * Executes a Dangerfile at a specific path, with a context.
 * The values inside a Danger context are applied as globals to the Dangerfiles runtime.
 *
 * @param {DangerContext} dangerfileContext the global danger context
 */
export async function createDangerfileRuntimeEnvironment(dangerfileContext: DangerContext): Promise<DangerContext> {
  return dangerfileContext
}

/**
 * Executes a Dangerfile at a specific path, with a context.
 * The values inside a Danger context are applied as globals to the Dangerfiles runtime.
 *
 * @param {string} filename the file path for the dangerfile
 * @param {any} environment the results of createDangerfileRuntimeEnvironment
 * @returns {DangerResults} the results of the run
 */
export async function runDangerfileEnvironment(
  filename: string,
  originalContents: string | undefined,
  environment: DangerContext
): Promise<DangerResults> {
  // We need to change the local runtime to support running JavaScript
  // and TypeScript through babel first. This is a simple implmentation
  // and if we need more nuance, then we can look at other implementations
  const customModuleHandler = (module: any, filename: string) => {
    if (!filename.includes("node_modules")) {
      d("Handling custom module: ", filename)
    }
    const contents = fs.readFileSync(filename, "utf8")
    const compiled = compile(contents, filename)
    module._compile(compiled, filename)
  }

  // Tell all these filetypes to ge the custom compilation
  require.extensions[".ts"] = customModuleHandler
  require.extensions[".tsx"] = customModuleHandler
  require.extensions[".js"] = customModuleHandler
  require.extensions[".jsx"] = customModuleHandler

  // Require our dangerfile
  originalContents = originalContents || fs.readFileSync(filename, "utf8")
  let content = cleanDangerfile(originalContents)
  let compiled = compile(content, filename)

  try {
    // Move all the DSL attributes into the global scope
    for (let key in environment) {
      if (environment.hasOwnProperty(key)) {
        let element = environment[key]
        global[key] = element
      }
    }

    d("Started parsing Dangerfile: ", filename)
    _require(compiled, filename, {})
    d("Finished running dangerfile: ", filename)
    // Don't stop all current async code from breaking,
    // however new code (without Peril support) can run
    // without the scheduler
    await runAllScheduledTasks(environment.results)

    return environment.results
  } catch (error) {
    console.error("Unable to evaluate the Dangerfile")
    d("Got a parse error: ", error)
    environment.results = resultsForCaughtError(filename, content, error)
    return environment.results
  }
}

const runAllScheduledTasks = async (results: DangerRuntimeContainer) => {
  if (results.scheduled) {
    d(`Scheduler waiting on: ${results.scheduled.length} tasks`)
    await Promise.all(
      results.scheduled.map((fnOrPromise: any) => {
        if (fnOrPromise instanceof Promise) {
          return fnOrPromise
        }
        if (fnOrPromise.length === 1) {
          // callback-based function
          return new Promise(res => fnOrPromise(res))
        }
        return fnOrPromise()
      })
    )
    d(`Finished scheduled tasks`)
  }
}

const defaultExport: DangerRunner = {
  createDangerfileRuntimeEnvironment,
  runDangerfileEnvironment,
}

export default defaultExport
