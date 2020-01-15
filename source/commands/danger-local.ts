#! /usr/bin/env node

import program from "commander"

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
  // TODO: this option
  // .option("-s, --staging", "Just use staged changes.")
  .description("Runs danger without PR metadata, useful for git hooks.")
  .option("-b, --base [branch_name]", "Use a different base branch")
setSharedArgs(program).parse(process.argv)

const app = (program as any) as App
const base = app.base || "master"

const localPlatform = new LocalGit({ base, staged: app.staging })
localPlatform.validateThereAreChanges().then(changes => {
  if (changes) {
    const fakeSource = new FakeCI(process.env)
    // By setting the custom env var we can be sure that the runner doesn't
    // try to find the CI danger is running on and use that.
    runRunner(app, { source: fakeSource, platform: localPlatform, additionalEnvVars: { DANGER_LOCAL_NO_CI: "yep" } })
  } else {
    console.log(`No git changes detected between head and ${base}.`)
  }
})
