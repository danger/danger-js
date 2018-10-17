import * as fs from "fs"
import * as path from "path"
import JSON5 from "json5"
import { debug } from "../../../debug"

const disableTranspilation = process.env.DANGER_DISABLE_TRANSPILATION === "true"

let hasNativeTypeScript = false
let hasBabel = false
let hasBabelTypeScript = false
let hasFlow = false
let hasChecked = false

const d = debug("transpiler:setup")

// Yes, lots of linter disables, but I want to support TS/Babel/Neither correctly
export const checkForNodeModules = () => {
  if (disableTranspilation) {
    hasChecked = true
    d("DANGER_DISABLE_TRANSPILATION environment variable has been set to true, skipping transpilation")
    return
  }

  try {
    require.resolve("typescript") // tslint:disable-line
    hasNativeTypeScript = true
  } catch (e) {
    d("Does not have TypeScript set up")
  }

  try {
    require.resolve("@babel/core") // tslint:disable-line
    require("@babel/polyfill") // tslint:disable-line
    hasBabel = true

    try {
      require.resolve("@babel/plugin-transform-typescript") // tslint:disable-line
      hasBabelTypeScript = true
    } catch (e) {
      d("Does not have Babel 7 TypeScript set up")
    }

    try {
      require.resolve("@babel/plugin-transform-flow-strip-types") // tslint:disable-line
      hasFlow = true
    } catch (e) {
      d("Does not have Flow set up")
    }
  } catch (e) {
    d("Does not have Babel set up")
  }

  hasChecked = true
}

// Now that we have a sense of what exists inside the users' node modules

export const typescriptify = (content: string): string => {
  const ts = require("typescript") // tslint:disable-line

  // Support custom TSC options, but also fallback to defaults
  let compilerOptions: any
  if (fs.existsSync("tsconfig.json")) {
    compilerOptions = JSON5.parse(fs.readFileSync("tsconfig.json", "utf8"))
  } else {
    compilerOptions = ts.getDefaultCompilerOptions()
  }

  let result = ts.transpileModule(content, sanitizeTSConfig(compilerOptions))
  return result.outputText
}

const sanitizeTSConfig = (config: any) => {
  if (!config.compilerOptions) {
    return config
  }

  const safeConfig = config

  // It can make sense to ship TS code with modules
  // for `import`/`export` syntax, but as we're running
  // the transpiled code on vanilla node - it'll need to
  // be used with plain old commonjs
  //
  // @see https://github.com/apollographql/react-apollo/pull/1402#issuecomment-351810274
  //
  if (safeConfig.compilerOptions.module) {
    safeConfig.compilerOptions.module = "commonjs"
  }

  return safeConfig
}

export const babelify = (content: string, filename: string, extraPlugins: string[]): string => {
  const babel = require("@babel/core") // tslint:disable-line
  if (!babel.transform) {
    return content
  }

  const options = babel.loadOptions ? babel.loadOptions({}) : { plugins: [] }

  const fileOpts = {
    filename,
    filenameRelative: filename,
    sourceMap: false,
    sourceFileName: undefined,
    sourceType: "module",
    plugins: [...extraPlugins, ...options.plugins],
  }

  const result = babel.transform(content, fileOpts)
  return result.code
}

export default (code: string, filename: string) => {
  if (!hasChecked) {
    checkForNodeModules()
  }

  const filetype = path.extname(filename)
  const isModule = filename.includes("node_modules")
  if (isModule) {
    return code
  }

  let result = code
  if (hasNativeTypeScript && filetype.startsWith(".ts")) {
    result = typescriptify(code)
  } else if (hasBabel && hasBabelTypeScript && filetype.startsWith(".ts")) {
    result = babelify(code, filename, ["transform-typescript"])
  } else if (hasBabel && filetype.startsWith(".js")) {
    result = babelify(code, filename, hasFlow ? ["@babel/plugin-transform-flow-strip-types"] : [])
  }

  return result
}
