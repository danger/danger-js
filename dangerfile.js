// @flow

import { danger, fail, warn } from "danger"
const fs = require("fs")

// warn on changes in Package.json and not in shrinkwrap
const hasChangelog = danger.git.modified_files.includes("changelog.md")
if (!hasChangelog) {
  fail("No Changelog changes!")
}

const jsFiles = danger.git.created_files.filter(path => path.endsWith("js"))

// new js files should have `@flow` at the top
// but exclude tests from being flow-ey
const unFlowedFiles = jsFiles.filter(path => !path.endsWith("test.js"))
  .filter(filepath => {
    const content = fs.readFileSync(filepath)
    return !content.includes("@flow")
  })

if (unFlowedFiles.length > 0) {
  warn(`These new JS files do not have Flow enabled: ${unFlowedFiles.join(", ")}`)
}
