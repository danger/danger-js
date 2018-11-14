import { debug } from "../../debug"
import * as path from "path"
import { spawn } from "child_process"

import { DangerDSLJSONType, DangerJSON } from "../../dsl/DangerDSL"
import { Executor } from "../../runner/Executor"
import { jsonToDSL } from "../../runner/jsonToDSL"
import { markdownCode, resultsWithFailure, mergeResults } from "./reporting"
import { readFileSync, existsSync } from "fs"
import { RunnerConfig } from "../ci/runner"

const d = debug("runDangerSubprocess")

// Sanitizes the DSL so for sending via STDOUT
export const prepareDangerDSL = (dangerDSL: DangerDSLJSONType) => {
  if (dangerDSL.github && dangerDSL.github.api) {
    delete dangerDSL.github.api
  }

  const dangerJSONOutput: DangerJSON = { danger: dangerDSL }
  return JSON.stringify(dangerJSONOutput, null, "  ") + "\n"
}

// Runs the Danger process
export const runDangerSubprocess = (
  subprocessName: string[],
  dslJSON: DangerDSLJSONType,
  exec: Executor,
  config: RunnerConfig
) => {
  let processName = subprocessName[0]
  let args = subprocessName
  let results = null as any
  args.shift() // mutate and remove the first element

  const processDisplayName = path.basename(processName)
  const dslJSONString = prepareDangerDSL(dslJSON)
  d(`Running subprocess: ${processDisplayName} - ${args}`)
  const child = spawn(processName, args, { env: { ...process.env, ...config.additionalEnvVars } })

  d(`Started passing in STDIN`)
  child.stdin.write(dslJSONString)
  child.stdin.end()
  d(`Passed in STDIN`)

  let allLogs = ""
  child.stdout.on("data", async data => {
    const stdout = data.toString()
    allLogs += stdout

    // There are two checks
    const maybeJSON = getJSONFromSTDOUT(stdout)
    const maybeJSONURL = getJSONURLFromSTDOUT(stdout)

    // Remove message sent back to danger-js
    const withoutURLs: string = data
      .toString()
      .replace(maybeJSON, "")
      .replace(maybeJSONURL, "")

    console.log(withoutURLs)

    // Pass it back to the user
    if (!results && maybeJSONURL) {
      d("Got JSON URL from STDOUT, results are at: \n" + maybeJSONURL)
      const url = maybeJSONURL.replace("danger-results:/", "")
      if (!existsSync(url)) {
        // prettier-ignore
        throw new Error(`Process '${subprocessName.join(" ")}' reported that its JSON results could be found at ${url}, but the file was missing. The STDOUT was: ${stdout}`)
      }
      results = JSON.parse(readFileSync(url, "utf8"))
    } else if (!results && maybeJSON) {
      d("Got JSON results from STDOUT, results: \n" + maybeJSON)
      results = JSON.parse(maybeJSON)
    }
  })

  child.stderr.on("data", data => {
    if (data.toString().trim().length !== 0) {
      console.log(data.toString())
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
    const danger = await jsonToDSL(dslJSON, config.source)
    await exec.handleResults(results, danger.git)
  })
}

/** Pulls out a URL that's from the STDOUT */
const getJSONURLFromSTDOUT = (stdout: string): string | undefined => {
  const match = stdout.match(/danger-results:\/\/*.+json/)
  if (!match) {
    return undefined
  }
  return match[0]
}

/** Pulls the JSON directly out, this has proven to be less reliable  */
const getJSONFromSTDOUT = (stdout: string): string | undefined => {
  const lines = stdout.split("\n")
  return lines.find(line => {
    const trimmed = line.trim()
    return (
      trimmed.startsWith("{") &&
      trimmed.endsWith("}") &&
      trimmed.includes("markdowns") &&
      trimmed.includes("fails") &&
      trimmed.includes("warnings")
    )
  })
}

export default runDangerSubprocess
