#! /usr/bin/env node

import * as program from "commander"
import * as debug from "debug"
import chalk from "chalk"

import { version } from "../../package.json"
import setSharedArgs, { SharedCLI } from "./utils/sharedDangerfileArgs"
import { runRunner } from "./run/runner"

const d = debug("danger:runner")
d(`argv: ${process.argv}`)

process.on("unhandledRejection", function(reason: string, _p: any) {
  console.log(chalk.red("Error: "), reason)
  process.exitCode = 1
})

// Provides the root node to the command-line architecture

program
  .version(version)
  .command("init", "Helps you get started with Danger")
  .command("process", "Like `run` but lets another process handle evaluating a Dangerfile")
  .command("pr", "Runs your changes against an existing PR")
  .command("runner", "Runs a dangerfile against a DSL passed in via STDIN")
  .command("run", "Runs danger on your local system")

setSharedArgs(program).parse(process.argv)

const app = (program as any) as SharedCLI
if (app.args.length === 0) {
  runRunner(app)
}
