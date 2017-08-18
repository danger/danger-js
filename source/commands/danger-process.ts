import * as program from "commander"
import { getCISource } from "../ci_source/get_ci_source"
import { getPlatformForEnv } from "../platforms/platform"
import { Executor } from "../runner/Executor"
import { providers } from "../ci_source/providers"
import { sentence } from "../runner/DangerUtils"
import * as chalk from "chalk"

declare const global: any

// TODO: if we get more options around the dangerfile, we should
//       support sharing `program` setup code with danger-pr.ts

program
  .option("-v, --verbose", "Verbose output of files")
  .option("-c, --external-ci-provider [modulePath]", "Specify custom CI provider")
  .option("-t, --text-only", "Provide an STDOUT only interface, Danger will not post to your PR")
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

      process.stdout.write(JSON.stringify(dangerDSL, null, "  "))
    }
  }
}

run()
