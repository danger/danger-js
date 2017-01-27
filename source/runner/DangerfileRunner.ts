import * as Runtime from "jest-runtime"
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
export async function createDangerfileRuntimeEnvironment(dangerfileContext: DangerContext): Promise<DangerfileRuntimeEnv> {
  const config = {
    cacheDirectory: os.tmpdir(),
    setupFiles: [],
    name: "danger",
    haste: {
      defaultPlatform: "danger-js"
    },
    moduleNameMapper: [],
    moduleFileExtensions: ["js"],
    transform: [["js$", "babel-jest"]],
    transformIgnorePatterns: [],
    cache: null,
    testRegex: "",
    testPathDirs: [process.cwd()]
  }

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
  const hasteConfig = { automock: false, maxWorkers: 1, resetCache: false }
  const hasteMap = await Runtime.createHasteMap(config, hasteConfig).build()
  const resolver = Runtime.createResolver(config, hasteMap.moduleMap)
  const runtime = new Runtime(config, environment, resolver)

  return {
    context,
    environment,
    runtime
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
export async function runDangerfileEnvironment(filename: Path, environment: DangerfileRuntimeEnv): Promise<DangerResults> {
  const runtime = environment.runtime
  // Require our dangerfile

  ensureCleanDangerfile(filename, () => {
    runtime.requireModule(filename)
  })

  return environment.context.results
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
  return contents
    .replace(es6Pattern, "// Removed import")
    .replace(requirePattern, "// Removed require")
}
