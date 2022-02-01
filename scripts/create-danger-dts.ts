import dts from "./danger-dts"
import * as fs from "fs"

// This could need to exist
if (!fs.existsSync("distribution")) {
  fs.mkdirSync("distribution")
}

const output = dts()

// This is so you can get it for this repo 👍
fs.writeFileSync("source/danger.d.ts", output)
fs.writeFileSync("distribution/danger.d.ts", output)
fs.writeFileSync("types/index.d.ts", "// TypeScript Version: 2.2\n" + output)

import * as ts from "typescript"

const program = ts.createProgram(["source/danger.d.ts"], { noEmit: true })
const emitResult = program.emit()
const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics)
if (allDiagnostics.length) {
  process.exitCode = 1
  console.log("Found an error in the generated DTS file, you probably need to edit scripts/danger-dts.ts")
  console.log(
    "\nIf you've added something new to the DSL, and the errors are about something missing, you may need to add an interface in `source/dsl/*`."
  )
  allDiagnostics.forEach((diagnostic) => {
    if (diagnostic.file) {
      let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!)
      let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
      console.error(`${diagnostic.file.fileName}:${line + 1}:${character + 1} - ${message}`)
    } else {
      console.error(`${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`)
    }
  })
} else {
  console.log("Awesome - shipped to source/danger.d.ts, distribution/danger.d.ts and types/index.d.ts")
}
