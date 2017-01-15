import * as program from "commander"
import * as debug from "debug"
import * as fs from "fs"
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
const stat = fs.statSync(dangerFile)

if (program.args.length === 0) {
  console.error("Please include a PR URL to run against")
  process.exitCode = 1
} else {
  const pr = pullRequestParser(program.args[0])

  if (!pr) {
    console.error("Could not get a repo and a PR number from your URL, bad copy & paste?")
    process.exitCode = 1
  } else {

    const source = new FakeCI({
      DANGER_TEST_REPO: pr.repo,
      DANGER_TEST_PR: pr.pullRequestNumber
    })

    const platform = new GitHub(null, source)

    if (!!stat && stat.isFile()) {
      d(`executing dangerfile at ${dangerFile}`)
      runDanger(source, platform, dangerFile)
    }
  }
}

async function runDanger(source: FakeCI, platform: GitHub, file: string) {
  const exec = new Executor(source, platform)

  const runtimeEnv = await exec.setupDanger()
  const results = await runDangerfileEnvironment(file, runtimeEnv)
  console.log(JSON.stringify(results))
}
