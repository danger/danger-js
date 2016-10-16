// @flow
import "babel-polyfill"

var program = require("commander")

import { getCISourceForEnv } from "../ci_source/ci_source"
import { getPlatformForEnv } from "../platforms/platform"
import Executor from "../runner/Executor"

program
  .option("-h, --head [commitish]", "TODO: Set the head commitish")
  .option("-b, --base [commitish]", "TODO: Set the base commitish")
  .option("-f, --fail-on-errors", "TODO: Fail on errors")
  .parse(process.argv)

let source = getCISourceForEnv(process.env)
if (!source) {
  console.log("Could not find a CI source for this run")
  process.exitCode = 1
}

if (source) {
  const platform = getPlatformForEnv(process.env, source)
  if (!platform) {
    console.log(`Could not find a source code hosting platform for ${source.name}`)
    process.exitCode = 1
  }

  if (platform) {
    console.log(`OK, looks good ${source.name} on ${platform.name}`)
    const exec = new Executor(source, platform)
    exec.run()
  }
}
