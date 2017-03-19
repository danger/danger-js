import * as program from "commander"
import * as debug from "debug"
import * as fs from "fs"
import { getCISource } from "../ci_source/get_ci_source"
import { getPlatformForEnv } from "../platforms/platform"
import { Executor } from "../runner/Executor"
import { dangerfilePath } from "./utils/file-utils"

const d = debug("danger:run")
declare const global: any

// TODO: if we get more options around the dangerfile, we should
//       support sharing `program` setup code with danger-pr.ts

program
  .option("-v, --verbose", "Verbose output of files")
  .option("-c, --external-ci-provider [modulePath]", "Specify custom CI provider")
  .option("-d, --dangerfile [filePath]", "Specify custom dangerfile other than default dangerfile.js")
  .parse(process.argv)

process.on("unhandledRejection", function(reason: string, _p: any) {
  console.log("Error: ", reason)
  process.exitCode = 1
})

if (process.env["DANGER_VERBOSE"] || (program as any).verbose) {
  global.verbose = true
}

// a dirty wrapper to allow async functionality in the setup
async function run(): Promise<any> {
  const source = getCISource(process.env, (program as any).externalCiProvider || undefined)

  if (!source) {
    console.log("Could not find a CI source for this run")
    // Check for ENV["CI"] and wanr they might want a local command instead?
    process.exitCode = 1
  }
  // run the sources setup function, if it exists
  if (source && source.setup) {
    await source.setup()
  }

  if (source && !source.isPR) {
    console.log("Skipping due to not being a PR")
  }

  if (source && source.isPR) {
    const platform = getPlatformForEnv(process.env, source)
    if (!platform) {
      console.log(`Could not find a source code hosting platform for ${source.name}`)
      process.exitCode = 1
    }

    if (platform) {
      const dangerFile = dangerfilePath(program)

      console.log(`OK, looks good ${source.name} on ${platform.name}`)

      try {
        const stat = fs.statSync(dangerFile)

        if (!!stat && stat.isFile()) {
          d(`executing dangerfile at ${dangerFile}`)
          const exec = new Executor(source, platform)
          exec.setupAndRunDanger(dangerFile)
        } else {
          console.error(`Looks like specified ${dangerFile} is not a valid path.`)
          process.exitCode = 1
        }
      } catch (error) {
        process.exitCode = 1
        console.error(error.message)
        console.error(error)
      }
    }
  }
}

run()
