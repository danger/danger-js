// @flow

import { danger, warn, markdown } from "danger"
import fs from "fs"

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
    const content = fs.readFileSync(filepath).toString()
    return !content.includes("@flow")
  })

if (unFlowedFiles.length > 0) {
  warn(`These new JS files do not have Flow enabled: ${unFlowedFiles.join(", ")}`)
}

if (danger.github.pr.body.includes("verbose")) {
  const codeblocks = (code: string, type = "json") => "``` " + type + "\n" + code + "\n```"
  markdown(`
### Debug Output From danger

## Git

${codeblocks(JSON.stringify(danger.git, null, 2))}

## GitHub

${codeblocks(JSON.stringify(danger.github, null, 2))}
  `)
}
