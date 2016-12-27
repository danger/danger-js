// @flow

import Runtime from "jest-runtime"
import NodeEnvironment from "jest-environment-node"
import os from "os"

import type { DangerResults } from "../dsl/DangerResults"
import type { DangerContext } from "../runner/Dangerfile"
import type { DangerfileRuntimeEnv, Environment, Path } from "./types"

/**
 * Executes a Dangerfile at a specific path, with a context.
 * The values inside a Danger context are applied as globals to the Dangerfiles runtime.
 *
 * @param {DangerContext} dangerfileContext the gloabl danger context
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
    cache: null
  }

  const environment: Environment = new NodeEnvironment(config)

  const runnerGlobal = environment.global
  const context = dangerfileContext

  // Adds things like fail, warn ... to global
  for (const prop in context) {
    if (context.hasOwnProperty(prop)) {
      const anyContext:any = context
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
  runtime.requireModule(filename)

  return environment.context.results
}
