import * as fs from "fs"

import { DangerDSLType } from "./source/dsl/DangerDSL"
declare var danger: DangerDSLType
declare function warn(params: string): void

const hasChangelog = danger.git.modified_files.includes("CHANGELOG.md")
const isTrivial = danger.github && (danger.github.pr.body + danger.github.pr.title).includes("#trivial")

if (!hasChangelog && !isTrivial) {
  warn(
    "Please add a changelog entry for your changes. You can find it in `CHANGELOG.md` \n\nPlease add your change and name to the main section."
  )
}

// Always ensure we name all CI providers in the README. These
// regularly get forgotten on a PR adding a new one.
const sentence = danger.utils.sentence

import { realProviders } from "./source/ci_source/providers"
const readme = fs.readFileSync("README.md").toString()
const names = realProviders.map((p) => new p({}).name)
const missing = names.filter((n) => !readme.includes(n))
if (missing.length) {
  warn(`These providers are missing from the README: ${sentence(missing)}`)
}
