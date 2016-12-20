
// type Path = string

// interface ResolverConfig {
//   browser?: boolean,
//   defaultPlatform: ?string,
//   extensions: Array<string>,
//   hasCoreModules: boolean,
//   moduleDirectories: Array<string>,
//   moduleNameMapper: ?{[key: string]: RegExp},
//   modulePaths: Array<Path>,
//   platforms?: Array<string>,
// };

// interface FindNodeModuleConfig {
//   basedir: Path,
//   browser?: boolean,
//   extensions: Array<string>,
//   moduleDirectory: Array<string>,
//   paths?: Array<Path>,
// };

// interface HasteConfig {
//   providesModuleNodeModules: Array<string>,
//   defaultPlatform?: ?string,
//   platforms?: Array<string>,
// };

interface Environment {
  constructor(config: any): void;
  dispose(): void;
  runScript(script: Script): any;
  global: any;
  fakeTimers: {
    clearAllTimers(): void;
    runAllImmediates(): void;
    runAllTicks(): void;
    runAllTimers(): void;
    runTimersToTime(): void;
    runOnlyPendingTimers(): void;
    runWithRealTimers(callback: any): void;
    useFakeTimers(): void;
    useRealTimers(): void;
  };
  testFilePath: string;
  moduleMocker: any;
};

import Runtime from "jest-runtime"
import NodeEnvironment from "jest-environment-node"
// import {contextForDanger} from "./Dangerfile"
import type { DangerDSLType } from "../dsl/DangerDSL"
import type { DangerResults } from "../dsl/DangerResults"

/**
 * Executes a Dangerfile
 * @param dangerfile
 */
export async function runDangerfile(filename: string, dangerfileContext: DangerContext) {
  const config: ResolverConfig | HasteConfig = {
    cacheDirectory: "danger-cache",
    setupFiles: [],
    name: "danger",
    haste: {
      defaultPlatform: "danger-js"
    },
    moduleFileExtensions: ["js"],
    moduleNameMapper: [],
    transform: [["js$", "babel-jest"]],
    transformIgnorePatterns: [],
    cache: null
  }

  const environment:Environment = new NodeEnvironment(config)
  const runnerGlobal = environment.global
  const context = dangerfileContext

  // Adds things like fail, warn ... to global
  for (const prop in context) {
    if (context.hasOwnProperty(prop)) {
      runnerGlobal[prop] = context[prop]
    }
  }

  // Setup a runtime environment
  const hasteConfig = { automock: false, maxWorkers: 1, resetCache: false }
  const hasteMap = await Runtime.createHasteMap(config, hasteConfig).build()
  const resolver = Runtime.createResolver(config, hasteMap.moduleMap)
  const runtime = new Runtime(config, environment, resolver)

  // Require our dangerfile
  // TODO: This needs to be able to support arbitrary strings
  runtime.requireModule(filename)

  return context.results
}
