import { NodeVM, NodeVMOptions } from "vm2"
import * as fs from "fs"

import { DangerContext } from "../../runner/Dangerfile"

import compile from "./utils/transpiler"
import cleanDangerfile from "./utils/cleanDangerfile"
import resultsForCaughtError from "./utils/resultsForCaughtError"
import { DangerRunner } from "./runner"

declare const regeneratorRuntime: any

// A WIP version of the runner which uses a vm2 based in-process runner
// this has a few caveats ATM:
//
// * Relative files aren't getting transpiled
// * Babel sometime with async functions in the runtime

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

export async function runDangerfileEnvironment(
  filename: string,
  originalContents: string | undefined,
  environment: NodeVMOptions
) {
  const vm = new NodeVM(environment)

  // Require our dangerfile
  originalContents = originalContents || fs.readFileSync(filename, "utf8")
  let content = cleanDangerfile(originalContents)

  try {
    vm.run(content, filename)

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
    return {
      fails: results.fails,
      warnings: results.warnings,
      messages: results.messages,
      markdowns: results.markdowns,
    }
  } catch (error) {
    console.error("Unable to evaluate the Dangerfile")
    return resultsForCaughtError(filename, content, error)
  }
}

const defaultExport: DangerRunner = {
  createDangerfileRuntimeEnvironment,
  runDangerfileEnvironment,
}

export default defaultExport
