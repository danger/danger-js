import * as fs from "fs"

import { DangerResults } from "../dsl/DangerResults"
import { DangerContext } from "../runner/Dangerfile"
import { Path } from "./types"

import { NodeVM, VMOptions } from "vm2"

/**
 * Executes a Dangerfile at a specific path, with a context.
 * The values inside a Danger context are applied as globals to the Dangerfiles runtime.
 *
 * @param {DangerContext} dangerfileContext the global danger context
 */
export async function createDangerfileRuntimeEnvironment(dangerfileContext: DangerContext): Promise<VMOptions> {
  const context = dangerfileContext

  const sandbox = {}
  // Adds things like fail, warn ... to global
  for (const prop in context) {
    if (context.hasOwnProperty(prop)) {
      const anyContext: any = context
      sandbox[prop] = anyContext[prop]
    }
  }

  return {
    sandbox,
  }
}

/**
 * Executes a Dangerfile at a specific path, with a context.
 * The values inside a Danger context are applied as globals to the Dangerfiles runtime.
 *
 * @param {string} filename the file path for the dangerfile
 * @param {any} environment the results of createDangerfileRuntimeEnvironment
 * @returns {DangerResults} the results of the run
 */
export async function runDangerfileEnvironment(filename: Path, environment: VMOptions): Promise<DangerResults> {
  const vm = new NodeVM(environment)

  // Require our dangerfile
  const originalContents = fs.readFileSync(filename).toString()
  const content = cleanDangerfile(originalContents)
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
}

// https://regex101.com/r/dUq4yB/1
const requirePattern = /^.* require\(('|")danger('|")\);?$/gm
//  https://regex101.com/r/dUq4yB/2
const es6Pattern = /^.* from ('|")danger('|");?$/gm

/**
 * Updates a Dangerfile to remove the import for Danger
 * @param {string} contents the file path for the dangerfile
 * @returns {string} the revised Dangerfile
 */
export function cleanDangerfile(contents: string): string {
  return contents.replace(es6Pattern, "// Removed import").replace(requirePattern, "// Removed require")
}
