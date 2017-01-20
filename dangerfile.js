// Removed import
import fs from "fs"
import includes from "lodash.includes"

// Request a CHANGELOG entry if not declared #trivial
const hasChangelog = includes(danger.git.modified_files, "changelog.md")
const isTrivial = includes((danger.github.pr.body + danger.github.pr.title), "#trivial")
if (!hasChangelog && !isTrivial) {
  warn("Please add a changelog entry for your changes.")

  // Politely ask for their name on the entry too
  const changelogDiff = danger.git.diffForFile("changelog.md")
  const contributorName = danger.github.pr.user.login
  if (changelogDiff && !includes(changelogDiff, contributorName)) {
    warn("Please add your GitHub name to the changelog entry, so we can attribute you.")
  }
}

// Warns if there are changes to package.json without changes to yarn.lock.
const packageChanged = includes(danger.git.modified_files, "package.json")
const lockfileChanged = includes(danger.git.modified_files, "yarn.lock")
if (packageChanged && !lockfileChanged) {
  const message = "Changes were made to package.json, but not to yarn.lock"
  const idea = "Perhaps you need to run `yarn install`?"
  warn(`${message} - <i>${idea}</i>`)
}
