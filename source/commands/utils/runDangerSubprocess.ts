import { spawn } from "child_process"

import { DangerDSL } from "../../dsl/DangerDSL"
import { Executor } from "../../runner/Executor"
import { markdownCode, resultsWithFailure } from "./reporting"

// Sanitizes the DSL so for sending via STDOUT
export const prepareDangerDSL = (dangerDSL: DangerDSL) => {
  if (dangerDSL.github && dangerDSL.github.api) {
    delete dangerDSL.github.api
  }

  return JSON.stringify(dangerDSL, null, "  ") + "\n"
}

// Runs the Danger process
const runDangerSubprocess = (subprocessName: string, dslJSONString: string, exec: Executor) => {
  const child = spawn(subprocessName)
  let allLogs = ""

  child.stdin.write(dslJSONString)
  child.stdin.end()

  child.stdout.on("data", async data => {
    data = data.toString()
    const trimmed = data.trim()
    if (trimmed.startsWith("{") && trimmed.endsWith("}") && trimmed.includes("markdowns")) {
      const results = JSON.parse(trimmed)
      await exec.handleResults(results)
    } else {
      console.log(`stdout: ${data}`)
      allLogs += data
    }
  })

  child.stderr.on("data", data => {
    console.log(`stderr: ${data}`)
  })

  child.on("close", async code => {
    console.log(`child process exited with code ${code}`)
    // Submit an error back to the PR
    if (code) {
      process.exitCode = code
      const results = resultsWithFailure(`${subprocessName}\` failed.`, "### Log\n\n" + markdownCode(allLogs))
      await exec.handleResults(results)
    }
  })
}

export default runDangerSubprocess
