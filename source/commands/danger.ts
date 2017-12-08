#! /usr/bin/env node

import { version } from "../../package.json"
import { ArgumentParser } from "argparse"
import * as debug from "debug"
import * as chalk from "chalk"

const d = debug("danger:runner")
d(`argv: ${process.argv}`)

process.on("unhandledRejection", function(reason: string, _p: any) {
  console.log(chalk.red("Error: "), reason)
  process.exitCode = 1
})

const parser = new ArgumentParser({
  version,
  prog: "danger",
  description: "Danger: Unit tests for Team Culture",
})

const subparsers = parser.addSubparsers({ title: "subcommands" })

subparsers.addParser("init", { help: "Helps you get started with Danger" })
subparsers.addParser("process", { help: "Like `run` but lets another process handle evaluating a Dangerfile" })

import * as pr from "./danger-pr"
pr.createParser(subparsers).setDefaults({
  entryPoint: (args: any) => {
    pr.main(args as pr.App)
  },
})

subparsers.addParser("runner", { help: "Runs a dangerfile against a DSL passed in via STDIN" })
subparsers.addParser("run", { help: "Runs danger on your local system (default)" })

const args = parser.parseArgs()

args.entryPoint(args)
