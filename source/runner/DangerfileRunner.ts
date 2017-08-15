import * as fs from "fs"
import * as path from "path"

import { DangerResults } from "../dsl/DangerResults"
import { DangerContext } from "../runner/Dangerfile"

import { NodeVM, NodeVMOptions } from "vm2"

let hasTypeScript = false
let hasBabel = false

declare const regeneratorRuntime: any

// You know you're being a dangerous badass when you have this many linter disables. Deal with it.
try {
  require.resolve("typescript") // tslint:disable-line
  hasTypeScript = true
} catch (e) {} // tslint:disable-line
try {
  require.resolve("babel-core") // tslint:disable-line
  require("babel-polyfill") // tslint:disable-line
  hasBabel = true
} catch (e) {} // tslint:disable-line

/**
 * Executes a Dangerfile at a specific path, with a context.
 * The values inside a Danger context are applied as globals to the Dangerfiles runtime.
 *
 * @param {DangerContext} dangerfileContext the global danger context
 */
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
      // import: hasBabel ? ["babel-polyfill"] : [],
    },
    sandbox: { ...dangerfileContext, regeneratorRuntime: regeneratorRuntime },
    compiler: compile,
  }
}

function compile(code: string, filename: string) {
  const filetype = path.extname(filename)
  let result = code
  if (hasTypeScript && filetype.startsWith(".ts")) {
    result = typescriptify(code)
  } else if (hasBabel && !filename.includes("node_modules") && filetype.startsWith(".js")) {
    result = babelify(code, filename)
  }

  return result
}

export type TranspileType = null | "babel" | "typescript"

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
  environment: NodeVMOptions
): Promise<DangerResults> {
  const vm = new NodeVM(environment)

  // Require our dangerfile
  originalContents = originalContents || fs.readFileSync(filename, "utf8")
  let content = cleanDangerfile(originalContents)

  // TODO: Relative imports get TS/Babel

  // var Module = require("module")
  // var originalRequire = Module.prototype.require

  // Module.prototype.require = function() {
  //   //do your thing here
  //   console.log(arguments)
  //   return originalRequire.apply(this, arguments)
  // }

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

/** Returns Markdown results to post if an exception is raised during the danger run */
const resultsForCaughtError = (file: string, contents: string, error: Error): DangerResults => {
  const failure = `Danger failed to run \`${file}\`.`
  const errorMD = `## Error ${error.name}
\`\`\`
${error.message}
${error.stack}
\`\`\`
### Dangerfile
\`\`\`
${contents}
\`\`\`
  `
  return { fails: [{ message: failure }], warnings: [], markdowns: [errorMD], messages: [] }
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

const typescriptify = (content: string): string => {
  const ts = require("typescript") // tslint:disable-line
  let result = ts.transpileModule(content, {})
  return result.outputText
}

const babelify = (content: string, filename: string): string => {
  const babel = require("babel-core") // tslint:disable-line
  const fileOpts = {
    filename,
    filenameRelative: filename,
    sourceMap: false,
    sourceFileName: null,
    sourceMapTarget: null,
  }

  const result = babel.transform(content, fileOpts)
  return result.code
}
