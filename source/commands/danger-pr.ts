import * as program from "commander"
import * as debug from "debug"
import * as fs from "fs"
import * as jsome from "jsome"

import { FakeCI } from "../ci_source/providers/Fake"
import { GitHub } from "../platforms/GitHub"
import { Executor } from "../runner/Executor"
import { pullRequestParser } from "../platforms/github/pullRequestParser"
import { runDangerfileEnvironment } from "../runner/DangerfileRunner"

const d = debug("danger:pr")

program
  .option("-d, --dangerfile [filePath]", "Specify custom dangefile other than default dangerfile.js")
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
    // TODO: Handle auth token
    // TODO: Use custom `fetch` in GitHub that stores and uses local cache if PR is closed, these PRs 
    //       shouldn't change often and there is a limit on API calls per hour.

    if (validateDangerfileExists(dangerFile)) {
      d(`executing dangerfile at ${dangerFile}`)
      const source = new FakeCI({ DANGER_TEST_REPO: pr.repo, DANGER_TEST_PR: pr.pullRequestNumber })
      const platform = new GitHub(null, source)
      runDanger(source, platform, dangerFile)
    }
  }
}

function validateDangerfileExists(filePath: string): boolean {
    let stat: fs.Stats | null = null
    try {
      stat = fs.statSync(filePath)
    } catch (error) {
      console.error(`Could not find a dangerfile at ${dangerFile}, not running against your PR.`)
      process.exitCode = 1
    }

    if (!!stat && !stat.isFile()) {
      console.error(`The resource at ${dangerFile} appears to not be a file, not running against your PR.`)
      process.exitCode = 1
    }

    return !!stat && !stat.isFile()
}

async function runDanger(source: FakeCI, platform: GitHub, file: string) {
  const exec = new Executor(source, platform)

  const runtimeEnv = await exec.setupDanger()
  const results = await runDangerfileEnvironment(file, runtimeEnv)
  jsome(results)
}
