import { NodeVM, NodeVMOptions } from "vm2"
import * as fs from "fs"

import { DangerContext } from "../../runner/Dangerfile"
import { debug } from "../../debug"

import compile from "./utils/transpiler"
import cleanDangerfile from "./utils/cleanDangerfile"
import resultsForCaughtError from "./utils/resultsForCaughtError"
import { DangerRunner } from "./runner"
import { DangerResults } from "../../dsl/DangerResults"

declare const regeneratorRuntime: any

const d = debug("vm2")

// A WIP version of the runner which uses a vm2 based in-process runner, only used by self-hosted
// heroku instances of Peril.
//
// It very useful for testing in Danger JS though, because it's super tough to test the real inline runner.
// as it depends on a process ending.
//
export async function createDangerfileRuntimeEnvironment(dangerfileContext: DangerContext): Promise<NodeVMOptions> {
  // This is for plugin support, we now have the Danger objects inside Danger's
  // main process context too. This means plugins that Danger depends on can also
  // get support for the globals.

  Object.keys(dangerfileContext).forEach(key => {
    global[key] = dangerfileContext[key]
  })

  return {
    require: {
      external: true,
      context: "host",
      builtin: ["*"],
    },
    sandbox: { ...dangerfileContext, regeneratorRuntime: regeneratorRuntime || {} },
    compiler: compile,
  }
}

export const runDangerfileEnvironment = async (
  filenames: string[],
  originalContents: string[] | undefined[],
  environment: any,
  injectedObjectToExport?: any
): Promise<DangerResults> => {
  // Loop through all files and their potential contents, then merge all
  // of the results into an empty re

  for (const filename of filenames) {
    const index = filenames.indexOf(filename)
    const originalContent = (originalContents && originalContents[index]) || fs.readFileSync(filename, "utf8")

    d(`Preparing to evaluate: ${filename}\n\n\n    `)
    d(originalContent.split("\n").join("\n    "))
    d(`-`)

    const vm = new NodeVM(environment)

    // Require our dangerfile
    let content = cleanDangerfile(originalContent)

    try {
      const optionalExport = vm.run(content, filename)
      if (typeof optionalExport.default === "function") {
        await optionalExport.default(injectedObjectToExport)
      }

      const results = environment.sandbox!.results!
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
    } catch (error) {
      const isJest = typeof jest !== "undefined"
      if (!isJest) {
        console.error("Unable to evaluate the Dangerfile")
      }

      // Call the internal functions to fail the build
      const errorResults = resultsForCaughtError(filename, content, error)
      environment.sandbox!.markdown(errorResults.markdowns[0].message)
      environment.sandbox!.fail(errorResults.fails[0].message)
    }
  }

  const results = environment.sandbox!.results!
  d(
    `Got md ${results.markdowns.length} w ${results.warnings.length} f ${results.fails.length} m ${
      results.messages.length
    }`
  )
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
