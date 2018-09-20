#! /usr/bin/env node

import program from "commander"
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
  .command("local", "Runs danger standalone on a repo, useful for git hooks")
  .command("reset-status", "Set the status of a PR to pending when a new CI run starts")
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
