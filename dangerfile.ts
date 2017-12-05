import { danger, warn } from "danger"

// No PR is too small to include a decription of why you made a change
if (danger.github.pr.body.length < 10) {
  warn("Please include a description of your PR changes.")
}

// Check for a CHANGELOG entry
const hasChangelog = danger.git.modified_files.includes("CHANGELOG.md")
const description = danger.github.pr.body + danger.github.pr.title
const isTrivial = description.includes("#trivial")

if (!hasChangelog && !isTrivial) {
  warn("Please add a changelog entry for your changes.")
}

// Request changes to source also include changes to tests.

const allChangedFiles = danger.git.modified_files.concat(danger.git.created_files)
const modifiedAppFiles = allChangedFiles.filter(p => includes(p, "source/"))
const modifiedTestFiles = allChangedFiles.filter(p => includes(p, "__tests__/"))

const hasAppChanges = modifiedAppFiles.length > 0
const hasTestChanges = modifiedTestFiles.length > 0
if (hasAppChanges && !hasTestChanges) {
  warn("This PR does not include any changes to tests, even though it affects app code.")
}
