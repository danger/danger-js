var fs = require("fs")
var fileOutput = ""

fs.readdir("source/dsl", (err, files) => {
  if (err) { return console.log("Could not read DSL folder") }
  for (var file of files) {
    fileOutput += fs.readFileSync(`source/dsl/${file}`).toString()
  }

  fileOutput += `
declare var danger: DangerDSL
`
  fileOutput = fileOutput.split("\n").filter((line) => {
    return !line.startsWith("import type") &&
        !line.startsWith('"use strict"') &&
        !line.startsWith("// @flow")
  }).join("\n")

//   fs.unlinkSync("source/flow_typed/export.js")
  fs.writeFileSync("source/flow_typed/export.js", fileOutput)
  console.log("Done")
})
