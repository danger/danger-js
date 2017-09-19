import * as chalk from "chalk"
import * as program from "commander"
import * as debug from "debug"

import { getPlatformForEnv } from "../platforms/platform"
import { Executor } from "../runner/Executor"
import { dangerfilePath } from "./utils/file-utils"
import setSharedArgs, { SharedCLI } from "./utils/sharedDangerfileArgs"
import validateDangerfileExists from "./utils/validateDangerfileExists"
import getRuntimeCISource from "./utils/getRuntimeCISource"

const d = debug("danger:run")
declare const global: any

program.usage("[options]").description("Runs a Dangerfile in JavaScript or TypeScript.")
setSharedArgs(program).parse(process.argv)

const app = (program as any) as SharedCLI

if (process.env["DANGER_VERBOSE"] || app.verbose) {
  global.verbose = true
}

// a dirty wrapper to allow async functionality in the setup
async function run() {
  const source = await getRuntimeCISource(app)

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
