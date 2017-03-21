import * as fs from "fs"

const createDTS = () => {
  let fileOutput = ""

  const extras = ["source/platforms/messaging/violation.ts"]
  const dslFiles = fs.readdirSync("source/dsl").map(f => `source/dsl/${f}`)

  dslFiles.concat(extras).forEach(file => {
    // Sometimes they have more stuff, in those cases
    // offer a way to crop the file.
    const content = fs.readFileSync(file).toString()
    if (content.includes("/// End of Danger DSL definition")) {
      fileOutput += content.split("/// End of Danger DSL definition")[0]
    } else {
      fileOutput += content
    }
    fileOutput += "\n"
  })

  // The definition of all the exposed vars is inside
  // the Dangerfile.js file.
  const allDangerfile = fs.readFileSync("source/runner/Dangerfile.ts").toString()
  const moduleContext = allDangerfile.split("/// Start of Danger DSL definition")[1].split("/// End of Danger DSL definition")[0]

  // we need to add either `declare function` or `declare var` to the interface
  const context = moduleContext.split("\n").map((line: string) => {
    if ((line.length === 0) || (line.includes("*"))) { return line }
    if (line.includes("(")) { return "declare function " + line.trim() }
    if (line.includes(":")) { return "declare const " + line.trim() }
    return ""
  }).join("\n")

  fileOutput += context

  // Remove all JS-y bits
  fileOutput = fileOutput.split("\n").filter((line) => {
    return !line.startsWith("import") &&
        !line.includes("* @type ")
  }).join("\n")

  return fileOutput.replace(/\n\s*\n\s*\n/g, "\n")
}

export default createDTS
