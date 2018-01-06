#! /usr/bin/env node

import * as program from "commander"
import chalk from "chalk"
import { version } from "../../package.json"

process.on("unhandledRejection", function(reason: string, _p: any) {
  console.log(chalk.red("Error: "), reason)
  process.exitCode = 1
})

// Provides the root node to the command-line architecture

program
  .version(version)
  .command("init", "Helps you get started with Danger")
  .command("ci", "Runs Danger on CI")
  .command("process", "Like `ci` but lets another process handle evaluating a Dangerfile")
  .command("pr", "Runs your local Dangerfile against an existing GitHub PR. Will not post on the PR")
  .command("runner", "Runs a dangerfile against a DSL passed in via STDIN [You probably don't need this]")
  .on("--help", () => {
    console.log("\n")
    console.log("  Docs:")
    console.log("")
    console.log("    -> Getting started:")
    console.log("       http://danger.systems/js/guides/getting_started.html")
    console.log("")
    console.log("    -> The Dangerfile")
    console.log("       http://danger.systems/js/guides/the_dangerfile.html")
    console.log("")
    console.log("    -> API Reference")
    console.log("       http://danger.systems/js/reference.html")
  })

program.parse(process.argv)

const showUpgradeNotice =
  process.env.CI && ["init", "ci", "process", "pr", "--help"].some(cmd => process.argv.includes(cmd))

if (showUpgradeNotice) {
  console.error("You may have updated from Danger 2.x -> 3.x without updating from `danger` to `danger ci`.")
}
