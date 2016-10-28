// @flow

// import danger from "danger"
import { danger, fail } from "./source/danger"

// warn on changes in Package.json and not in shrinkwrap
const hasChangelog = danger.git.modified_files.includes("changelog.md")
if (!hasChangelog) {
  fail("No Changelog changes!")
}

// warn on changelog
// console.log(danger)
// console.log(danger.git)
// console.log(danger.git.created_files)
fail("Another message instead")
