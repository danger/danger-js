#! /usr/bin/env node

import * as program from "commander"

import setSharedArgs, { SharedCLI } from "./utils/sharedDangerfileArgs"
import { runRunner } from "./ci/runner"
import { LocalGit } from "../platforms/LocalGit"
import { FakeCI } from "../ci_source/providers/Fake"

interface App extends SharedCLI {
  /** What should we compare against? */
  base?: string
  /** Should we run against current staged changes? */
  staging?: boolean
}

program
  .usage("[options]")
  .option("-b, --base  [base]", "Choose the base commit to work against.")
  // TODO: this option
  // .option("-s, --staging", "Just use staged changes.")
  .description("Runs danger without PR metadata, useful for git hooks.")
setSharedArgs(program).parse(process.argv)

const app = (program as any) as App
const base = app.base || "master"
const localPlatform = new LocalGit({ base, staged: app.staging })
const fakeSource = new FakeCI(process.env)
runRunner(app, { source: fakeSource, platform: localPlatform })
