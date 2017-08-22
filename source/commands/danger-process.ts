// Given the nature of this command, it can be tricky to test, so I use a command like this:
//
// env DANGER_GITHUB_API_TOKEN='xxx' DANGER_FAKE_CI="YEP" DANGER_TEST_REPO='artsy/eigen' DANGER_TEST_PR='2408'
//   yarn ts-node -s -- source/commands/danger-process.ts ./scripts/danger_runner.rb
//
//

import { spawn } from "child_process"

import * as program from "commander"
import { getCISource } from "../ci_source/get_ci_source"
import { getPlatformForEnv } from "../platforms/platform"
import { Executor } from "../runner/Executor"
import { providers } from "../ci_source/providers"
import { sentence } from "../runner/DangerUtils"
import * as chalk from "chalk"

declare const global: any

let subprocessName: string | undefined

program
  .usage("[options] <process_name>")
  .description(
    "Does a Danger run, but instead of handling the execution of a Dangerfile it will pass the DSL " +
      "into another process expecting the process to eventually return results back as JSON. If you don't " +
      "provide another process, then it will output to STDOUT."
  )
  .option("-v, --verbose", "Verbose output of files")
  .option("-c, --external-ci-provider [modulePath]", "Specify custom CI provider")
  .option("-t, --text-only", "Provide an STDOUT only interface, Danger will not post to your PR")
  .action(process_name => (subprocessName = process_name))
  .parse(process.argv)

// The dynamic nature of the program means typecasting a lot
// use this to work with dynamic propeties
const app = program as any

process.on("unhandledRejection", function(reason: string, _p: any) {
  console.log(chalk.red("Error: "), reason)
  process.exitCode = 1
})

// const encoding = "utf-8"
// let data = ""

// process.stdin.setEncoding(encoding)

// process.stdin.on("readable", function() {
//   var chunk
//   while ((chunk = process.stdin.read())) {
//     data += chunk
//   }
// })

// process.stdin.on("end", function() {
//   // There will be a trailing \n from the user hitting enter. Get rid of it.
//   data = data.replace(/\n$/, "")
//   processIncomingResults(data)
// })

if (process.env["DANGER_VERBOSE"] || app.verbose) {
  global.verbose = true
}

// const processIncomingResults = (response: string) => response

// a dirty wrapper to allow async functionality in the setup
async function run(): Promise<any> {
  const source = getCISource(process.env, app.externalCiProvider || undefined)

  if (!source) {
    console.log("Could not find a CI source for this run. Does Danger support this CI service?")
    console.log(`Danger supports: ${sentence(providers.map(p => p.name))}.`)

    if (!process.env["CI"]) {
      console.log("You may want to consider using `danger pr` to run Danger locally.")
    }

    process.exitCode = 1
  }
  // run the sources setup function, if it exists
  if (source && source.setup) {
    await source.setup()
  }

  if (source && !source.isPR) {
    // This does not set a failing exit code
    console.log("Skipping Danger due to not this run not executing on a PR.")
  }

  if (source && source.isPR) {
    const platform = getPlatformForEnv(process.env, source)
    if (!platform) {
      console.log(chalk.red(`Could not find a source code hosting platform for ${source.name}.`))
      console.log(
        `Currently DangerJS only supports GitHub, if you want other platforms, consider the Ruby version or help out.`
      )
      process.exitCode = 1
    }

    if (platform) {
      const config = {
        stdoutOnly: app.textOnly,
        verbose: app.verbose,
      }

      const exec = new Executor(source, platform, config)
      const dangerDSL = await exec.dslForDanger()

      // Remove this to reduce STDOUT spam
      if (dangerDSL.github && dangerDSL.github.api) {
        delete dangerDSL.github.api
      }

      const dslJSONString = JSON.stringify(dangerDSL, null, "  ") + "\n"
      if (!subprocessName) {
        process.stdout.write(dslJSONString)
      } else {
        const child = spawn(subprocessName)

        child.stdin.write(dslJSONString)
        child.stdin.end()

        child.stdout.on("data", data => {
          console.log(`stdout: ${data}`)
        })

        child.stderr.on("data", data => {
          console.log(`stderr: ${data}`)
        })

        child.on("close", code => {
          console.log(`child process exited with code ${code}`)
        })
      }
    }
  }
}

run()
