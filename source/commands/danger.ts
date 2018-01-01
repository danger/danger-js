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

const sharedOptions = {
  version,
  prog: "danger",
  description: "Danger: Unit tests for Team Culture",
}
// The ArgumentParser constructor mutates; cloning works around it.
const mainParser = new ArgumentParser(Object.assign({}, sharedOptions))
const shortcutParser = new ArgumentParser(
  Object.assign(
    {
      debug: true,
      addHelp: false,
    },
    sharedOptions
  )
)

const subparsers = mainParser.addSubparsers({ title: "subcommands" })

import * as dangerInit from "./danger-init"
import * as dangerProcess from "./danger-process"
import * as dangerPr from "./danger-pr"
import * as dangerRunner from "./danger-runner"
import * as dangerRun from "./danger-run"

// For each subcommand, set a bogus `entryPoint` argument which we use below
// to start the program.

dangerInit.createParser(subparsers).setDefaults({
  entryPoint: (args: dangerInit.App) => {
    dangerInit.main(args)
  },
})

dangerProcess.createParser(subparsers).setDefaults({
  entryPoint: (args: dangerProcess.App) => {
    dangerProcess.main(args)
  },
})

dangerPr.createParser(subparsers).setDefaults({
  entryPoint: (args: dangerPr.App) => {
    dangerPr.main(args)
  },
})

dangerRunner.createParser(subparsers).setDefaults({
  entryPoint: (args: dangerRunner.App) => {
    dangerRunner.main(args)
  },
})

dangerRun.createParser(subparsers).setDefaults({
  entryPoint: (args: dangerRun.App) => {
    dangerRun.main(args)
  },
})

dangerRun.addArguments(shortcutParser)
shortcutParser.setDefaults({
  entryPoint: (args: dangerRun.App) => {
    dangerRun.main(args)
  },
})

let args
try {
  args = shortcutParser.parseArgs()
} catch (e) {
  args = mainParser.parseArgs()
}

console.log("args", args)
args.entryPoint(args)
