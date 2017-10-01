import * as fs from "fs"
import * as path from "path"
import * as pinpoint from "pinpoint"

import { DangerResults } from "../dsl/DangerResults"
import { DangerContext } from "../runner/Dangerfile"

import { NodeVM, NodeVMOptions } from "vm2"

let hasNativeTypeScript = false
let hasBabel = false
let hasBabelTypeScript = false
let hasFlow = false

declare const regeneratorRuntime: any

// You know you're being a dangerous badass when you have this many linter disables. Deal with it.

try {
  require.resolve("typescript") // tslint:disable-line
  hasNativeTypeScript = true
} catch (e) {} // tslint:disable-line

try {
  require.resolve("babel-core") // tslint:disable-line
  require("babel-polyfill") // tslint:disable-line
  hasBabel = true

  try {
    require.resolve("babel-plugin-transform-typescript") // tslint:disable-line
    hasBabelTypeScript = true
  } catch (e) {} // tslint:disable-line

  try {
    require.resolve("babel-plugin-transform-flow-strip-types") // tslint:disable-line
    hasFlow = true
  } catch (e) {} // tslint:disable-line
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
  if (hasNativeTypeScript && !filename.includes("node_modules") && filetype.startsWith(".ts")) {
    result = typescriptify(code)
  } else if (hasBabel && hasBabelTypeScript && !filename.includes("node_modules") && filetype.startsWith(".ts")) {
    result = babelify(code, filename, ["transform-typescript"])
  } else if (hasBabel && !filename.includes("node_modules") && filetype.startsWith(".js")) {
    result = babelify(code, filename, hasFlow ? ["transform-flow-strip-types"] : [])
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

  const fetchContents = async () => {
    return new Promise<string>((resolve, reject) => {
      if (originalContents) {
        resolve(originalContents)
      } else {
        fs.readFile(filename, "utf8", (error, data) => {
          if (error) {
            reject(error)
          } else {
            resolve(data)
          }
        })
      }
    })
  }

  // Require our dangerfile
  const fetchedContents = await fetchContents()
  let content = cleanDangerfile(fetchedContents)

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
    // Let Peril handle the error, if it's running inside the Peril environment
    // it can provide more metadata.
    if (process.env["PERIL_INTEGRATION_ID"]) {
      throw error
    }
    return resultsForCaughtError(filename, content, error)
  }
}

/** Returns Markdown results to post if an exception is raised during the danger run */
const resultsForCaughtError = (file: string, contents: string, error: Error): DangerResults => {
  const match = /(\d+:\d+)/g.exec(error.stack!)
  let code
  if (match) {
    const [line, column] = match[0].split(":").map(value => parseInt(value, 10) - 1)
    code = pinpoint(contents, { line, column })
  } else {
    code = contents
  }
  const failure = `Danger failed to run \`${file}\`.`
  const errorMD = `## Error ${error.name}
\`\`\`
${error.message}
${error.stack}
\`\`\`
### Dangerfile
\`\`\`
${code}
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

const babelify = (content: string, filename: string, extraPlugins: string[]): string => {
  const babel = require("babel-core") // tslint:disable-line
  if (!babel.transform) {
    return content
  }

  const options = babel.loadOptions ? babel.loadOptions({}) : { plugins: [] }

  const fileOpts = {
    filename,
    filenameRelative: filename,
    sourceMap: false,
    sourceFileName: null,
    sourceMapTarget: null,
    plugins: [...extraPlugins, ...options.plugins],
  }

  const result = babel.transform(content, fileOpts)
  return result.code
}
