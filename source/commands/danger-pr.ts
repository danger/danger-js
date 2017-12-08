import { ArgumentParser, SubParser } from "argparse"
import * as debug from "debug"
import * as jsome from "jsome"

import { FakeCI } from "../ci_source/providers/Fake"
import { GitHub } from "../platforms/GitHub"
import { GitHubAPI } from "../platforms/github/GitHubAPI"
import { Executor } from "../runner/Executor"
import { pullRequestParser } from "../platforms/github/pullRequestParser"
import { runDangerfileEnvironment } from "../runner/runners/inline"
import { dangerfilePath } from "./utils/file-utils"
import validateDangerfileExists from "./utils/validateDangerfileExists"
import openRepl from "./utils/repl"
import { SharedCLI, registerSharedArgs } from "./utils/sharedDangerfileArgs"

import inlineRunner from "../runner/runners/inline"
import { jsonDSLGenerator } from "../runner/dslGenerator"
import { prepareDangerDSL } from "./utils/runDangerSubprocess"

// yarn build; cat source/_tests/fixtures/danger-js-pr-384.json |  node --inspect  --inspect-brk distribution/commands/danger-runner.js --text-only

const d = debug("danger:pr")

export interface App extends SharedCLI {
  /** Should we show the Danger Process PR JSON? */
  json: boolean
  js: boolean
  repl: boolean
  prUrl: string
}

export function createParser(subparsers: SubParser): ArgumentParser {
  const parser = subparsers.addParser("pr", { help: "Runs your changes against an existing PR" })

  registerSharedArgs(parser)

  parser.addArgument(["-J", "--json"], {
    action: "storeTrue",
    help: "Output the JSON that would be passed into `danger process` for this PR.",
  })
  parser.addArgument(["-j", "--js"], {
    action: "storeTrue",
    help: "Strips the readbility changes to the DSL JSON.",
  })
  parser.addArgument(["--repl"], {
    action: "storeTrue",
    help: "Drop into a Node.js REPL after evaluating the dangerfile",
  })

  parser.addArgument(["prUrl"], {
    metavar: "PR_URL",
    help: "URL of the pull request",
  })

  return parser
}

export async function main(app: App) {
  const dangerFile = dangerfilePath(app)
  const pr = pullRequestParser(app.prUrl)
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
        runProcessJSON(app, platform)
      } else {
        runDanger(app, source, platform, dangerFile)
      }
    }
  }
}

// Run Danger traditionally
async function runDanger(app: App, source: FakeCI, platform: GitHub, file: string) {
  const config = {
    stdoutOnly: app.textOnly,
    verbose: app.verbose,
    jsonOnly: false,
  }

  const exec = new Executor(source, platform, inlineRunner, config)

  const runtimeEnv = await exec.setupDanger()
  const results = await runDangerfileEnvironment(file, undefined, runtimeEnv)
  if (app.repl) {
    openRepl(runtimeEnv)
  } else {
    jsome(results)
  }
}

// Run Danger Process and output the JSON to CLI
async function runProcessJSON(app: App, platform: GitHub) {
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
