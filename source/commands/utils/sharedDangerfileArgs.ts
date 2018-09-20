import program from "commander"
import chalk from "chalk"

process.on("unhandledRejection", function(reason: string, _p: any) {
  console.log(chalk.red("Error: "), reason)
  process.exitCode = 1
})

export interface SharedCLI extends program.CommanderStatic {
  verbose: boolean
  externalCiProvider: string
  textOnly: boolean
  dangerfile: string
  id: string
  repl: string
}

export default (command: any) =>
  command
    .option("-v, --verbose", "Verbose output of files")
    .option("-c, --external-ci-provider [modulePath]", "Specify custom CI provider")
    .option("-t, --text-only", "Provide an STDOUT only interface, Danger will not post to your PR")
    .option("-d, --dangerfile [filePath]", "Specify a custom dangerfile path")
    .option("-i, --id [danger_id]", "Specify a unique Danger ID for the Danger run")
    .option("-b, --base [branch_name]", "Base branch")
