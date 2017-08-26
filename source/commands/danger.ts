#! /usr/bin/env node

import { version } from "../../package.json"
import * as program from "commander"
import * as debug from "debug"

const d = debug("danger:runner")

d(`argv: ${process.argv}`)

// Provides the root node to the command-line architecture
program
  .version(version)
  .command("run", "Runs danger on your local system", { isDefault: true })
  .command("process", "Like `run` but lets another process handle evaluating a Dangerfile")
  .command("pr", "Runs your changes against an existing PR")
  .parse(process.argv)
