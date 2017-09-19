import * as program from "commander"

export interface SharedCLI extends program.ICommand {
  verbose: boolean
  externalCiProvider: string
  textOnly: boolean
  dangerfile: string
}

export default (command: program.ICommand) =>
  command
    .option("-v, --verbose", "Verbose output of files")
    .option("-c, --external-ci-provider [modulePath]", "Specify custom CI provider")
    .option("-t, --text-only", "Provide an STDOUT only interface, Danger will not post to your PR")
    .option("-d, --dangerfile [filePath]", "Specify a custom dangerfile path")
