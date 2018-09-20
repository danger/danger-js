#! /usr/bin/env node

import program from "commander"
import { debug } from "../debug"
import jsome from "jsome"

import { FakeCI } from "../ci_source/providers/Fake"
import { pullRequestParser } from "../platforms/pullRequestParser"
import { dangerfilePath } from "./utils/file-utils"
import validateDangerfileExists from "./utils/validateDangerfileExists"
import setSharedArgs, { SharedCLI } from "./utils/sharedDangerfileArgs"
import { jsonDSLGenerator } from "../runner/dslGenerator"
import { prepareDangerDSL } from "./utils/runDangerSubprocess"
import { runRunner } from "./ci/runner"
import { Platform, getPlatformForEnv } from "../platforms/platform"

// yarn build; cat source/_tests/fixtures/danger-js-pr-384.json |  node --inspect  --inspect-brk distribution/commands/danger-runner.js --text-only

const d = debug("pr")
const log = console.log

interface App extends SharedCLI {
  /** Should we show the Danger Process PR JSON? */
  json: boolean
  js: boolean
}

program
  .usage("[options] <pr_url>")
  .description("Emulate running Danger against an existing GitHub Pull Request.")
  .option("-J, --json", "Output the raw JSON that would be passed into `danger process` for this PR.")
  .option("-j, --js", "A more human-readable version of the JSON.")

  .on("--help", () => {
    log("\n")
    log("  Docs:")
    if (!process.env["DANGER_GITHUB_API_TOKEN"] && !process.env["DANGER_BITBUCKETSERVER_HOST"]) {
      log("")
      log("     You don't have a DANGER_GITHUB_API_TOKEN set up, this is optional, but TBH, you want to do this.")
      log("     Check out: http://danger.systems/js/guides/the_dangerfile.html#working-on-your-dangerfile")
      log("")
    }
    log("")
    log("    -> API Reference")
    log("       http://danger.systems/js/reference.html")
    log("")
    log("    -> Getting started:")
    log("       http://danger.systems/js/guides/getting_started.html")
    log("")
    log("    -> The Dangerfile")
    log("       http://danger.systems/js/guides/the_dangerfile.html")
  })

setSharedArgs(program).parse(process.argv)

const app = (program as any) as App

const dangerFile = dangerfilePath(program)

if (program.args.length === 0) {
  console.error("Please include a PR URL to run against")
  process.exitCode = 1
} else {
  const pr = pullRequestParser(program.args[0])

  if (!pr) {
    console.error("Could not get a repo and a PR number from your URL, bad copy & paste?")
    process.exitCode = 1
  } else {
    // TODO: Use custom `fetch` in GitHub that stores and uses local cache if PR is closed, these PRs
    //       shouldn't change often and there is a limit on API calls per hour.

    console.log(`Starting Danger PR on ${pr.repo}#${pr.pullRequestNumber}`)

    if (validateDangerfileExists(dangerFile)) {
      d(`executing dangerfile at ${dangerFile}`)
      const source = new FakeCI({ DANGER_TEST_REPO: pr.repo, DANGER_TEST_PR: pr.pullRequestNumber })
      const platform = getPlatformForEnv(process.env, source, /* requireAuth */ false)

      if (app.json || app.js) {
        d("getting just the JSON/JS DSL")
        runHalfProcessJSON(platform)
      } else {
        d("running process separated Danger")
        // Always post to STDOUT in `danger-pr`
        app.textOnly = true

        // Can't send these to `danger runner`
        delete app.js
        delete app.json
        runRunner(app, { source, platform })
      }
    }
  }
}

// Run the first part of a Danger Process and output the JSON to CLI
async function runHalfProcessJSON(platform: Platform) {
  const dangerDSL = await jsonDSLGenerator(platform)
  const processInput = prepareDangerDSL(dangerDSL)
  const output = JSON.parse(processInput)
  const dsl = { danger: output }
  // See https://github.com/Javascipt/Jsome/issues/12
  if (app.json) {
    process.stdout.write(JSON.stringify(dsl, null, 2))
  } else if (app.js) {
    jsome(dsl)
  }
}
