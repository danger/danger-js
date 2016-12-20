// @flow

// import { danger, warn } from "danger"
import fs from "fs"
// const fs = require("fs")

// Request a CHANGELOG entry
const hasChangelog = danger.git.modified_files.includes("changelog.md")
if (!hasChangelog) { warn("Please add a changelog entry for your changes.") }

// Politely ask for their name on the entry too
const changelogDiff = danger.git.diffForFile("changelog.md")
const contributorName = danger.github.pr.user.login
if (changelogDiff && changelogDiff.indexOf(contributorName) === -1) {
  warn("Please add your GitHub name to the changelog entry, so we can attribute you.")
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

