import * as fs from "fs"
import * as path from "path"

import { DangerResults } from "../../dsl/DangerResults"
import { DangerContext } from "../../runner/Dangerfile"

import { DangerRunner } from "./runner"

import compile from "./utils/transpiler"
import cleanDangerfile from "./utils/cleanDangerfile"
import resultsForCaughtError from "./utils/resultsForCaughtError"
var Module = require("module")

import * as vm from "vm"

/**
 * Executes a Dangerfile at a specific path, with a context.
 * The values inside a Danger context are applied as globals to the Dangerfiles runtime.
 *
 * @param {DangerContext} dangerfileContext the global danger context
 */
export async function createDangerfileRuntimeEnvironment(dangerfileContext: DangerContext): Promise<DangerContext> {
  return dangerfileContext
}

// /**
//  * A quick implmentation of what actually happens when require is called, but
//  * without the file acccess. This comes from
//  * https://stackoverflow.com/questions/17581830/load-node-js-module-from-string-in-memory#17585470
//  *
//  * If this implmentation isn't enough, we can use the module require-from-string
//  *
//  * @param src the source code
//  * @param filename the path the file represents on disk
//  */
// function requireFromString(src: string, filename: string) {
//   var parent = module.parent
//   var m = new Module(filename, parent)
//   m.paths = Module._nodeModulePaths(path.dirname(filename))
//   m._compile(src, filename)
//   return m.exports
// }

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
    for (var key in environment) {
      if (environment.hasOwnProperty(key)) {
        var element = environment[key]
        global[key] = element
      }
    }

    debugger

    // Fake a `require("dangerfile")` via the internal module API
    // requireFromString(compiled, filename)

    vm.runInThisContext(compiled, {
      filename: filename,
      lineOffset: 0,
      displayErrors: true,
    })

    // compiledWrapper.gr

    const results = environment.results
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
