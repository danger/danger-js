// @flow
import "babel-polyfill"

var program = require("commander")

import { getCISourceForEnv } from "../ci_source/ci_source_selector"
import { GitHub } from "../platforms/github"

// import type { Platform } from "../platforms/platform"
// import type { CISource } from "../ci_source/ci_source"
import FakeCI from "../ci_source/fake"

program
  .option("-h, --head [commitish]", "TODO: Set the head commitish")
  .option("-b, --base [commitish]", "TODO: Set the base commitish")
  .option("-f, --fail-on-errors", "TODO: Fail on errors")
  .parse(process.argv)

// function setupPlatformWithSource(platform:Platform, source: CISource): void {

// }

let source = getCISourceForEnv(process.env)
let fake = new FakeCI(process.env)
let github = new GitHub("OK", fake)
github.getInfo()

if (source) {
  console.log("OK?")
  console.log(source.isCI)
  console.log("Is PR?")
  console.log(source.isPR)
} else {
  console.log("Could not find a CI source for this run")
  process.exit(0)
}
