import * as program from "commander"
import * as debug from "debug"
import * as jsome from "jsome"

import { FakeCI } from "../ci_source/providers/Fake"
import { GitHub } from "../platforms/GitHub"
import { GitHubAPI } from "../platforms/github/GitHubAPI"
import { Executor } from "../runner/Executor"
import { pullRequestParser } from "../platforms/github/pullRequestParser"
import { runDangerfileEnvironment } from "../runner/DangerfileRunner"
import { dangerfilePath } from "./utils/file-utils"
import validateDangerfileExists from "./utils/validateDangerfileExists"
import openRepl from "./utils/repl"
import setSharedArgs, { SharedCLI } from "./utils/sharedDangerfileArgs"

const d = debug("danger:pr")

program.usage("[options] <pr_url>").description("Emulate running Danger against an existing GitHub Pull Request.")
setSharedArgs(program).parse(process.argv)

const app = (program as any) as SharedCLI

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
      runDanger(source, platform, dangerFile)
    }
  }
}

async function runDanger(source: FakeCI, platform: GitHub, file: string) {
  const config = {
    stdoutOnly: app.textOnly,
    verbose: app.verbose,
  }

  const exec = new Executor(source, platform, config)

  const runtimeEnv = await exec.setupDanger()
  const results = await runDangerfileEnvironment(file, undefined, runtimeEnv)
  if (program.repl) {
    openRepl(runtimeEnv.sandbox)
  } else {
    jsome(results)
  }
}
