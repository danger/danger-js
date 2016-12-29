// @flow
import "babel-polyfill"

var program = require("commander")

import { getCISourceForEnv } from "../ci_source/ci_source"
import { getPlatformForEnv } from "../platforms/platform"
import Executor from "../runner/Executor"

program
  .option("-f, --fail-on-errors", "TODO: Fail on errors")
  .parse(process.argv)

process.on("unhandledRejection", function(reason: string, p: any) {
  console.log("Error: ", reason)
  process.exitCode = 1
})

const source = getCISourceForEnv(process.env)
if (!source) {
  console.log("Could not find a CI source for this run")
  // Check for ENV["CI"] and wanr they might want a local command instead?
  process.exitCode = 1
}

if (source && !source.isPR) {
  console.log("Skipping due to not being a PR")
}

if (source && source.isPR) {
  const platform = getPlatformForEnv(process.env, source)
  if (!platform) {
    console.log(`Could not find a source code hosting platform for ${source.name}`)
    process.exitCode = 1
  }

  if (platform) {
    console.log(`OK, looks good ${source.name} on ${platform.name}`)
    try {
      const exec = new Executor(source, platform)
      exec.setupAndRunDanger("dangerfile.js")
    } catch (error) {
      process.exitCode = 1
      console.error(error.message)
      console.error(error)
    }
  }
}
