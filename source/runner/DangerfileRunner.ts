import * as Runtime from "jest-runtime"
import { ModuleMap } from "jest-haste-map"
import { readConfig } from "jest-config"
import * as NodeEnvironment from "jest-environment-node"
import * as os from "os"
import * as fs from "fs"

import { DangerResults } from "../dsl/DangerResults"
import { DangerContext } from "../runner/Dangerfile"
import { DangerfileRuntimeEnv, Environment, Path } from "./types"

/**
 * Executes a Dangerfile at a specific path, with a context.
 * The values inside a Danger context are applied as globals to the Dangerfiles runtime.
 *
 * @param {DangerContext} dangerfileContext the global danger context
 * @returns {any} the results of the run
 */
export async function createDangerfileRuntimeEnvironment(
  dangerfileContext: DangerContext
): Promise<DangerfileRuntimeEnv> {
  const config = await dangerJestConfig()
  const environment: Environment = new NodeEnvironment(config)

  const runnerGlobal = environment.global
  const context = dangerfileContext

  // Adds things like fail, warn ... to global
  for (const prop in context) {
    if (context.hasOwnProperty(prop)) {
      const anyContext: any = context
      runnerGlobal[prop] = anyContext[prop]
    }
  }

  // Setup a runtime environment
  const resolver = Runtime.createResolver(config, new ModuleMap({}, {}))
  const runtime = new Runtime(config, environment, resolver)

  return {
    context,
    environment,
    runtime,
  }
}

/**
 * The Jest config object for this Danger run
 * @returns {any} the results of the run
 */
export async function dangerJestConfig() {
  // Note: This function is making assumptions that
  // the Dangerfile is being ran from the CWD

  // Get the original jest config, this means
  // we can re-use things like haste transformers.
  // so if you can make you tests run right,
  // then it's pretty likely that Danger can do it too.
  const jestConfig = await readConfig([], process.cwd())
  return {
    cacheDirectory: os.tmpdir(),
    setupFiles: [],
    name: "danger",
    testEnvironment: "node",
    haste: {
      defaultPlatform: "danger-js",
    },
    moduleNameMapper: [],
    moduleDirectories: ["node_modules"],
    moduleFileExtensions: ["js", ...jestConfig.config.moduleFileExtensions],
    transform: [["js$", "babel-jest"], ...jestConfig.config.transform],
    testPathIgnorePatterns: jestConfig.config.testPathIgnorePatterns,
    cache: null,
    testRegex: "",
    testPathDirs: [process.cwd()],
    transformIgnorePatterns: ["/node_modules/"],
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
export async function runDangerfileEnvironment(
  filename: Path,
  environment: DangerfileRuntimeEnv
): Promise<DangerResults> {
  const runtime = environment.runtime
  // Require our dangerfile

  ensureCleanDangerfile(filename, () => {
    runtime.requireModule(filename)
  })

  const results = environment.context.results
  await Promise.all(
    results.scheduled.map(fnOrPromise => {
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

/**
 * Passes in a dangerfile path, will remove any references to import/require `danger`
 * then runs the internal closure with a "safe" version of the Dangerfile.
 * Then it will clean itself up afterwards, and use the new version.
 *
 * Note: We check for equality to not trigger the jest watcher for tests.
 *
 * @param {string} filename the file path for the dangerfile
 * @param {Function} closure code to run with a cleaned Dangerfile
 * @returns {void}
 */
function ensureCleanDangerfile(filename: string, closure: Function) {
  const originalContents = fs.readFileSync(filename).toString()
  updateDangerfile(filename)

  closure()

  if (originalContents !== fs.readFileSync(filename).toString()) {
    fs.writeFileSync(filename, originalContents)
  }
}

/**
 * Updates a Dangerfile to remove the import for Danger
 * @param {string} filename the file path for the dangerfile
 * @returns {void}
 */
export function updateDangerfile(filename: Path) {
  const contents = fs.readFileSync(filename).toString()
  const cleanedDangerFile = cleanDangerfile(contents)
  if (contents !== cleanedDangerFile) {
    fs.writeFileSync(filename, cleanDangerfile(contents))
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
