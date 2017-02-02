import * as program from "commander"
import * as debug from "debug"
import * as fs from "fs"
import * as repl from "repl"
import * as jsome from "jsome"

import { FakeCI } from "../ci_source/providers/Fake"
import { GitHub } from "../platforms/GitHub"
import { GitHubAPI } from "../platforms/github/GitHubAPI"
import { Executor } from "../runner/Executor"
import { pullRequestParser } from "../platforms/github/pullRequestParser"
import { runDangerfileEnvironment } from "../runner/DangerfileRunner"
import { DangerContext } from "../runner/Dangerfile"

const d = debug("danger:pr")

program
  .option("-d, --dangerfile [filePath]", "Specify custom dangerfile other than default dangerfile.js")
  .option("-r, --repl", "Drop into a Node REPL after evaluating the dangerfile")
  .parse(process.argv)

const dangerFile = (program as any).dangerfile || "dangerfile.js"

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
      const api = new GitHubAPI(process.env["DANGER_GITHUB_API_TOKEN"], source)
      const platform = new GitHub(api)
      runDanger(source, platform, dangerFile)
    }
  }
}

function validateDangerfileExists(filePath: string): boolean {
    let stat: fs.Stats | null = null
    try {
      stat = fs.statSync(filePath)
    } catch (error) {
      console.error(`Could not find a dangerfile at ${filePath}, not running against your PR.`)
      process.exitCode = 1
    }

    if (!!stat && !stat.isFile()) {
      console.error(`The resource at ${filePath} appears to not be a file, not running against your PR.`)
      process.exitCode = 1
    }

    return !!stat && stat.isFile()
}

async function runDanger(source: FakeCI, platform: GitHub, file: string) {
  const exec = new Executor(source, platform)

  const runtimeEnv = await exec.setupDanger()
  const results = await runDangerfileEnvironment(file, runtimeEnv)
  if (program["repl"]) {
    openRepl(runtimeEnv.context)
  } else {
    jsome(results)
  }
}

function openRepl(dangerContext: DangerContext): void {
  /**
   * Injects a read-only, global variable into the REPL
   *
   * @param {repl.REPLServer} repl The Node REPL created via `repl.start()`
   * @param {string} name The name of the global variable
   * @param {*} value The value of the global variable
   */
  function injectReadOnlyProperty(repl: repl.REPLServer, name: string, value: any) {
    Object.defineProperty(repl["context"], name, {
      configurable: false,
      enumerable: true,
      value
    })
  }

  /**
   * Sets up the Danger REPL with `danger` and `results` global variables
   *
   * @param {repl.REPLServer} repl The Node REPL created via `repl.start()`
   */
  function setup(repl: repl.REPLServer) {
    injectReadOnlyProperty(repl, "danger", dangerContext.danger)
    injectReadOnlyProperty(repl, "results", dangerContext.results)
  }

  const dangerRepl = repl.start({ prompt: "> " })
  setup(dangerRepl)
  dangerRepl.on("exit", () => process.exit())
  // Called when `.clear` is executed in the Node REPL
  // This ensures that `danger` and `results` are not cleared from the REPL context
  dangerRepl.on("reset", () => setup(dangerRepl))
}
