#! /usr/bin/env node

import * as program from "commander"
import * as debug from "debug"
import * as jsome from "jsome"

import { FakeCI } from "../ci_source/providers/Fake"
import { GitHub } from "../platforms/GitHub"
import { GitHubAPI } from "../platforms/github/GitHubAPI"
import { Executor, ExecutorOptions } from "../runner/Executor"
import { pullRequestParser } from "../platforms/github/pullRequestParser"
import { runDangerfileEnvironment } from "../runner/runners/inline"
import { dangerfilePath } from "./utils/file-utils"
import validateDangerfileExists from "./utils/validateDangerfileExists"
import openRepl from "./utils/repl"
import setSharedArgs, { SharedCLI } from "./utils/sharedDangerfileArgs"

import inlineRunner from "../runner/runners/inline"
import { jsonDSLGenerator } from "../runner/dslGenerator"
import { prepareDangerDSL } from "./utils/runDangerSubprocess"

// yarn build; cat source/_tests/fixtures/danger-js-pr-384.json |  node --inspect  --inspect-brk distribution/commands/danger-runner.js --text-only

const d = debug("danger:pr")

interface App extends SharedCLI {
  /** Should we show the Danger Process PR JSON? */
  json: boolean
  js: boolean
}

program
  .usage("[options] <pr_url>")
  .description("Emulate running Danger against an existing GitHub Pull Request.")
  .option("-J, --json", "Output the JSON that would be passed into `danger process` for this PR.")
  .option("-j, --js", "Strips the readbility changes to the DSL JSON.")

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

    if (validateDangerfileExists(dangerFile)) {
      d(`executing dangerfile at ${dangerFile}`)
      const source = new FakeCI({ DANGER_TEST_REPO: pr.repo, DANGER_TEST_PR: pr.pullRequestNumber })
      const api = new GitHubAPI(source, process.env["DANGER_GITHUB_API_TOKEN"])
      const platform = new GitHub(api)
      if (app.json || app.js) {
        runProcessJSON(platform)
      } else {
        runDanger(source, platform, dangerFile)
      }
    }
  }
}

// Run Danger traditionally
async function runDanger(source: FakeCI, platform: GitHub, file: string) {
  const config: ExecutorOptions = {
    stdoutOnly: app.textOnly,
    verbose: app.verbose,
    jsonOnly: false,
    dangerID: "default",
  }
  const exec = new Executor(source, platform, inlineRunner, config)

  const runtimeEnv = await exec.setupDanger()
  const results = await runDangerfileEnvironment(file, undefined, runtimeEnv)
  if (program.repl) {
    openRepl(runtimeEnv)
  } else {
    jsome(results)
  }
}

// Run Danger Process and output the JSON to CLI
async function runProcessJSON(platform: GitHub) {
  const dangerDSL = await jsonDSLGenerator(platform)
  const processInput = prepareDangerDSL(dangerDSL)
  const output = JSON.parse(processInput)
  const dsl = { danger: output }
  // See https://github.com/Javascipt/Jsome/issues/12
  if (app.json) {
    process.stdout.write(JSON.stringify(dsl, null, 2))
  } else {
    jsome(dsl)
  }
}
