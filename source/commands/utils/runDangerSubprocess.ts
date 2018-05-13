import * as debug from "debug"
import * as path from "path"
import { spawn } from "child_process"

import { DangerDSLJSONType, DangerJSON } from "../../dsl/DangerDSL"
import { Executor } from "../../runner/Executor"
import { jsonToDSL } from "../../runner/jsonToDSL"
import { markdownCode, resultsWithFailure, mergeResults } from "./reporting"

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
const runDangerSubprocess = (subprocessName: string[], dslJSON: DangerDSLJSONType, exec: Executor) => {
  let processName = subprocessName[0]
  let args = subprocessName
  let results = {} as any
  args.shift() // mutate and remove the first element

  const processDisplayName = path.basename(processName)
  const dslJSONString = prepareDangerDSL(dslJSON)
  d(`Running subprocess: ${processDisplayName} - ${args}`)
  const child = spawn(processName, args, { env: process.env })
  let allLogs = ""

  child.stdin.write(dslJSONString)
  child.stdin.end()

  child.stdout.on("data", async data => {
    data = data.toString()
    const trimmed = data.trim()
    if (trimmed.startsWith("{") && trimmed.endsWith("}") && trimmed.includes("markdowns")) {
      d("Got JSON results from STDOUT")
      results = JSON.parse(trimmed)
    } else {
      console.log(`${data}`)
      allLogs += data
    }
  })

  child.stderr.on("data", data => {
    if (data.toString().trim().length !== 0) {
      console.log(`${data}`)
    }
  })

  child.on("close", async code => {
    d(`child process exited with code ${code}`)
    // Submit an error back to the PR
    if (code) {
      d(`Handling fail from subprocess`)
      process.exitCode = code

      const failResults = resultsWithFailure(`${processDisplayName}\` failed.`, "### Log\n\n" + markdownCode(allLogs))
      if (results) {
        results = mergeResults(results, failResults)
      } else {
        results = failResults
      }
    }
    const danger = await jsonToDSL(dslJSON)
    await exec.handleResults(results, danger.git)
  })
}

export default runDangerSubprocess
