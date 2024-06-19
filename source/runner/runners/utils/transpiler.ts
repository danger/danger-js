import * as fs from "fs"
import * as path from "path"
import JSON5 from "json5"
import { debug } from "../../../debug"

const enum BabelPackagePrefix {
  V7 = "@babel/",
  BEFORE_V7 = "babel-",
}

const disableTranspilation = process.env.DANGER_DISABLE_TRANSPILATION === "true"
const disableTsc = process.env.DANGER_DISABLE_TSC === "true"

let hasNativeTypeScript = false
let hasBabel = false
let hasBabelTypeScript = false
let hasFlow = false
let hasChecked = false
// By default assume Babel 7 is used
let babelPackagePrefix = BabelPackagePrefix.V7

const d = debug("transpiler:setup")

// Yes, lots of linter disables, but I want to support TS/Babel/Neither correctly
export const checkForNodeModules = () => {
  if (disableTranspilation) {
    hasChecked = true
    d("DANGER_DISABLE_TRANSPILATION environment variable has been set to true, skipping transpilation")
    return
  }

  try {
    require.resolve("typescript")
    hasNativeTypeScript = true && !disableTsc
  } catch (e) {
    d("Does not have TypeScript set up")
  }

  const checkForBabel = (prefix: BabelPackagePrefix) => {
    require.resolve(`${prefix}core`)
    babelPackagePrefix = prefix
    hasBabel = true
  }

  try {
    // Check for Babel 7
    checkForBabel(BabelPackagePrefix.V7)
  } catch (e) {
    try {
      // Check for older Babel versions
      checkForBabel(BabelPackagePrefix.BEFORE_V7)
    } catch (e) {
      d("Does not have Babel set up")
    }
  }

  if (hasBabel) {
    require("core-js/stable") // tslint:disable-line
    require("regenerator-runtime/runtime") // tslint:disable-line
    try {
      require.resolve(`${babelPackagePrefix}plugin-transform-typescript`)
      hasBabelTypeScript = true
    } catch (e) {
      d("Does not have Babel 7 TypeScript set up")
    }

    try {
      require.resolve(`${babelPackagePrefix}plugin-transform-flow-strip-types`)
      hasFlow = true
    } catch (e) {
      d("Does not have Flow set up")
    }
  }

  hasChecked = true
}

export const dirContains = (rootDir: string, dir: string): boolean => {
  const relative = path.relative(rootDir, dir)
  // on win32, relative can refer to a different drive
  if (path.isAbsolute(relative)) {
    return false
  }
  return !relative.startsWith("..")
}

// Now that we have a sense of what exists inside the users' node modules

export const lookupTSConfig = (dir: string): string | null => {
  const filename = "tsconfig.json"
  let filepath = path.join(dir, filename)

  if (fs.existsSync(filepath)) {
    return filepath
  }

  const rootDir = path.resolve()
  dir = path.resolve(dir)

  if (rootDir === dir) {
    return null
  }

  // if root dir is disconnected, we only check in the root
  if (!dirContains(rootDir, dir)) {
    filepath = filename
    return fs.existsSync(filepath) ? filepath : null
  }

  dir = path.dirname(dir)
  do {
    filepath = path.join(dir, filename)
    if (fs.existsSync(filepath)) {
      return path.relative(rootDir, filepath)
    }
    dir = path.dirname(dir)
  } while (dirContains(rootDir, dir))

  return null
}

export const typescriptify = (content: string, dir: string, esm: boolean = false): string => {
  const ts = require("typescript")

  // Support custom TSC options, but also fallback to defaults
  let compilerOptions: any
  const tsConfigPath = lookupTSConfig(dir)
  if (tsConfigPath) {
    compilerOptions = JSON5.parse(fs.readFileSync(tsConfigPath, "utf8"))
  } else {
    compilerOptions = ts.getDefaultCompilerOptions()
  }

  let result = ts.transpileModule(content, sanitizeTSConfig(compilerOptions, esm))
  return result.outputText
}

const sanitizeTSConfig = (config: any, esm: boolean = false) => {
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
    if (!esm) {
      // .ts files should fall back to commonjs
      safeConfig.compilerOptions.module = "commonjs"
    } else {
      // .mts files must use `import`/`export` syntax
      safeConfig.compilerOptions.module = "es6"
    }
  }

  return safeConfig
}

export const babelify = (content: string, filename: string, extraPlugins: string[]): string => {
  const babel = require(`${babelPackagePrefix}core`)
  // Since Babel 7, it is recommended to use `transformSync`.
  // For older versions, we fallback to `transform`.
  // @see https://babeljs.io/docs/en/babel-core#transform
  const transformSync = babel.transformSync || babel.transform
  if (!transformSync) {
    return content
  }

  const options = babel.loadOptions ? babel.loadOptions({ filename }) : { plugins: [] }

  const fileOpts = {
    filename,
    filenameRelative: filename,
    sourceMap: false,
    sourceFileName: undefined,
    sourceType: "module",
    plugins: [...extraPlugins, ...options.plugins],
  }

  const result = transformSync(content, fileOpts)
  d("Result from Babel:")
  d(result)
  return result.code
}

export default (code: string, filename: string, remoteFile: boolean = false) => {
  if (!hasChecked) {
    checkForNodeModules()
  }

  let filetype: string
  if (remoteFile) {
    d(`Parsing the file from the remote reference ${filename}`)
    let [file, _] = filename.split("@")
    filetype = path.extname(file)
  } else {
    filetype = path.extname(filename)
  }
  const isModule = filename.includes("node_modules")
  if (isModule) {
    return code
  }

  let result = code
  if (hasNativeTypeScript && (filetype.startsWith(".ts") || filetype.startsWith(".mts"))) {
    d("compiling with typescript")
    result = typescriptify(code, path.dirname(filename), filename.endsWith(".mts"))
  } else if (hasBabel && hasBabelTypeScript && filetype.startsWith(".ts")) {
    d("compiling as typescript with babel")
    result = babelify(code, filename, [`${babelPackagePrefix}plugin-transform-typescript`])
  } else if (hasBabel && filetype.startsWith(".js")) {
    d("babelifying as javascript")
    result = babelify(code, filename, hasFlow ? [`${babelPackagePrefix}plugin-transform-flow-strip-types`] : [])
  }

  return result
}
