import * as chalk from "chalk"
import * as program from "commander"
import * as debug from "debug"

import { getCISource } from "../ci_source/get_ci_source"
import { providers } from "../ci_source/providers"
import { getPlatformForEnv } from "../platforms/platform"
import { sentence } from "../runner/DangerUtils"
import { Executor } from "../runner/Executor"
import { dangerfilePath } from "./utils/file-utils"
import setSharedArgs, { SharedCLI } from "./utils/sharedDangerfileArgs"
import validateDangerfileExists from "./utils/validateDangerfileExists"

const d = debug("danger:run")
declare const global: any

program.usage("[options]").description("Runs a Dangerfile in JavaScript or TypeScript.")

setSharedArgs(program).parse(process.argv)

const app = (program as any) as SharedCLI

process.on("unhandledRejection", function(reason: string, _p: any) {
  console.log(chalk.red("Error: "), reason)
  process.exitCode = 1
})

if (process.env["DANGER_VERBOSE"] || app.verbose) {
  global.verbose = true
}

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
        `Currently Danger JS only supports GitHub, if you want other platforms, consider the Ruby version or help out.`
      )
      process.exitCode = 1
    }

    if (platform) {
      console.log(`${chalk.bold("OK")}, everything looks good: ${source.name} on ${platform.name}`)
      const dangerFile = dangerfilePath(program)

      const exists = validateDangerfileExists(dangerFile)
      if (!exists) {
        console.error(chalk.red(`Looks like your path '${dangerFile}' is not a valid path for a Dangerfile.`))
        process.exitCode = 1
      } else {
        d(`executing dangerfile at ${dangerFile}`)

        const config = {
          stdoutOnly: app.textOnly,
          verbose: app.verbose,
        }

        const exec = new Executor(source, platform, config)
        exec.setupAndRunDanger(dangerFile)
      }
    }
  }
}

run()
