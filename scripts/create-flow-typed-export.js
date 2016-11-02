var fs = require("fs")
var fileOutput = ""

fs.readdir("source/dsl", (err, files) => {
  if (err) { return console.log("Could not read DSL folder") }
  for (var file of files) {
    // Sometimes they have more stuff, in those cases
    // offer a way to crop the file.
    const content = fs.readFileSync(`source/dsl/${file}`).toString()
    if (content.includes("/* END FLOWTYPE")) {
      fileOutput += content.split("/* END FLOWTYPE")[0]
    } else {
      fileOutput += content
    }
  }

  // The definition of all the exposed vars is inside
  // the Dangerfile.js file.
  const allDangerfile = fs.readFileSync("source/runner/Dangerfile.js").toString()
  const moduleContext = allDangerfile.split("BEGIN FLOWTYPE EXPORT */")[1].split("/* END FLOWTYPE")[0]

  // we need to add either `declare function` or `declare var` to the interface
  const context = moduleContext.split("\n").map((line) => {
    if ((line.length === 0) || (line.includes("*"))) { return line }
    if (line.includes("(")) { return "    declare function " + line.trim() }
    if (line.includes(":")) { return "    declare var " + line.trim() }
  }).join("\n")

  fileOutput += `
declare module "danger" {
  declare module.exports: {
    ${context}
  };
}
`
  // Remove all JS-y bits
  fileOutput = fileOutput.split("\n").filter((line) => {
    return !line.startsWith("import type") &&
        !line.startsWith('"use strict"') &&
        !line.startsWith("// @flow") &&
        !line.includes("* @type ")
  }).join("\n")

  // We don't export in  the definitions files
  fileOutput = fileOutput.replace(/export interface/gi, "interface")

  // Remove any 2 line breaks
  fileOutput = fileOutput.replace(/\n\s*\n/g, "\n")

  // This is so you can get it for this repo 👍
  fs.writeFileSync("flow-typed/npm/danger_v0.x.x.js", fileOutput)

  console.log("Awesome - shipped to flow-typed/npm/danger_v0.x.x.js")
  console.log("This should get sent to the main repo.")
})
