import * as fs from "fs"

import { debug } from "../../debug"
import * as _require from "require-from-string"

import { DangerResults, DangerRuntimeContainer } from "../../dsl/DangerResults"
import { DangerContext } from "../../runner/Dangerfile"

import { DangerRunner } from "./runner"

import compile from "./utils/transpiler"
import cleanDangerfile from "./utils/cleanDangerfile"
import resultsForCaughtError from "./utils/resultsForCaughtError"

const d = debug("inline_runner")

/**
 * Executes a Dangerfile at a specific path, with a context.
 * The values inside a Danger context are applied as globals to the Dangerfiles runtime.
 *
 * @param {DangerContext} dangerfileContext the global danger context
 */
export async function createDangerfileRuntimeEnvironment(dangerfileContext: DangerContext): Promise<DangerContext> {
  return dangerfileContext
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

/**
 * Executes a Dangerfile at a specific path, with a context.
 * The values inside a Danger context are applied as globals to the Dangerfiles runtime.
 *
 * @param {string} filename the file path for the dangerfile
 * @param {string} originalContents optional, the JS pre-compiled
 * @param {DangerContext} environment the results of createDangerfileRuntimeEnvironment
 * @param {any | undefined} injectedObjectToExport an optional object for passing into default exports
 * @returns {DangerResults} the results of the run
 */
export const runDangerfileEnvironment = async (
  filenames: string[],
  originalContents: (string | undefined)[],
  environment: DangerContext,
  injectedObjectToExport?: any
): Promise<DangerResults> => {
  // We need to change the local runtime to support running JavaScript
  // and TypeScript through babel first. This is a simple implementation
  // and if we need more nuance, then we can look at other options
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

  // Loop through all files and their potential contents, they edit
  // results inside the env, so no need to keep track ourselves

  for (const filename of filenames) {
    const index = filenames.indexOf(filename)
    const originalContent = (originalContents && originalContents[index]) || fs.readFileSync(filename, "utf8")
    let content = cleanDangerfile(originalContent)
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
      const optionalExport = _require(compiled, filename, {})

      if (typeof optionalExport.default === "function") {
        d("Running default export from Dangerfile", filename)
        await optionalExport.default(injectedObjectToExport)
      }
      d("Finished running dangerfile: ", filename)
      // Don't stop all current async code from breaking,
      // however new code (without Peril support) can run
      // without the scheduler
      await runAllScheduledTasks(environment.results)
    } catch (error) {
      console.log("Unable to evaluate the Dangerfile\n", error)
      d("Got a parse error: ", error)

      // Call the internal functions to fail the build
      const errorResults = resultsForCaughtError(filename, content, error)
      environment.markdown(errorResults.markdowns[0].message)
      environment.fail(errorResults.fails[0].message)
    }
  }

  const results = environment.results
  return {
    fails: results.fails,
    warnings: results.warnings,
    messages: results.messages,
    markdowns: results.markdowns,
  }
}

const defaultExport: DangerRunner = {
  createDangerfileRuntimeEnvironment,
  runDangerfileEnvironment,
}

export default defaultExport
