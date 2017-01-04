// import { danger, warn } from "danger"
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