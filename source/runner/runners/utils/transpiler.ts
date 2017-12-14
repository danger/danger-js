import * as fs from "fs"
import * as path from "path"

let hasNativeTypeScript = false
let hasBabel = false
let hasBabelTypeScript = false
let hasFlow = false

// Yes, lots of linter disables, but I want to support TS/Babel/Neither correctly

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

// Now that we have a sense of what exists inside the users' node modules

export const typescriptify = (content: string): string => {
  const ts = require("typescript") // tslint:disable-line
  const compilerOptions = JSON.parse(fs.readFileSync("tsconfig.json", "utf8"))
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
    sourceType: "module",
    plugins: [...extraPlugins, ...options.plugins],
  }

  const result = babel.transform(content, fileOpts)
  return result.code
}

export default (code: string, filename: string) => {
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
    result = babelify(code, filename, hasFlow ? ["transform-flow-strip-types"] : [])
  }

  return result
}
