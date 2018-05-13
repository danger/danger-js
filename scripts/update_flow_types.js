const fs = require("fs")

// kill the two generated danger dts files
if (fs.existsSync("./source/_danger.d.ts")) {
  fs.unlinkSync("./source/_danger.d.ts")
}

if (fs.existsSync("./source/_danger.d.tse")) {
  fs.unlinkSync("./source/_danger.d.tse")
}

const exportedLines = [
  "function schedule",
  "function fail",
  "function warn",
  "function message",
  "function markdown",
  "var danger",
  "var results",
]

var flowDef = fs.readFileSync("distribution/danger.js.flow", "utf8")
exportedLines.forEach(line => {
  // from declare function schedule
  // to   declare export function schedule
  const find = "declare " + line
  const newLine = "declare export " + line
  flowDef = flowDef.replace(find, newLine)
})

const prefix = `
// This is generated in danger/danger-js/scripts/update_flow_types.js

import type { GitHub } from "@octokit/rest"
`

fs.writeFileSync("distribution/danger.js.flow", prefix + flowDef)
