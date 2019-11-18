#! /usr/bin/env node

import program from "commander"

import setSharedArgs, { SharedCLI } from "./utils/sharedDangerfileArgs"
import { runRunner } from "./ci/runner"

program
  .usage("[options]")
  .description("Runs a Dangerfile in JavaScript or TypeScript.")
  .option("--no-publish-check", "Don't add Danger check to PR", false)

setSharedArgs(program).parse(process.argv)

const app = (program as any) as SharedCLI
runRunner(app)
