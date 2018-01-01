import * as debug from "debug"
import { spawn } from "child_process"

import { DangerDSLJSONType, DangerJSON } from "../../dsl/DangerDSL"
import { Executor } from "../../runner/Executor"
import { markdownCode, resultsWithFailure } from "./reporting"

const d = debug("danger:runDangerSubprocess")

// Sanitizes the DSL so for sending via STDOUT
export const prepareDangerDSL = (dangerDSL: DangerDSLJSONType) => {
  if (dangerDSL.github && dangerDSL.github.api) {
    delete dangerDSL.github.api
  }

  const dangerJSONOutput: DangerJSON = { danger: dangerDSL }
  return JSON.stringify(dangerJSONOutput, null, "  ") + "\n"
}

// Runs the Danger process, can either take a simpl
const runDangerSubprocess = (subprocessName: string[], dslJSONString: string, exec: Executor) => {
  let processName = subprocessName[0]
  let args = subprocessName
  args.shift() // mutate and remove the first element

  d(`Running subprocess: ${processName} - ${args}`)
  const child = spawn(processName, args, { env: process.env })
  let allLogs = ""

  child.stdin.write(dslJSONString)
  child.stdin.end()

  child.stdout.on("data", async data => {
    data = data.toString()
    const trimmed = data.trim()
    if (trimmed.startsWith("{") && trimmed.endsWith("}") && trimmed.includes("markdowns")) {
      d("Got JSON results")
      const results = JSON.parse(trimmed)
      await exec.handleResults(results)
    } else {
      if (data.trim().length === 0) {
        console.log(`stdout: ${data}`)
      }
      allLogs += data
    }
  })

  child.stderr.on("data", data => {
    if (data.toString().trim().length === 0) {
      console.log(`stdout: ${data}`)
    }
  })

  child.on("close", async code => {
    d(`child process exited with code ${code}`)
    // Submit an error back to the PR
    if (code) {
      d(`Handling potential fail`)
      process.exitCode = code
      const results = resultsWithFailure(`${subprocessName}\` failed.`, "### Log\n\n" + markdownCode(allLogs))
      await exec.handleResults(results)
    }
  })
}

export default runDangerSubprocess
