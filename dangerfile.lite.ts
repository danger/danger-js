import * as fs from "fs"

import { DangerDSLType } from "./source/dsl/DangerDSL"
declare var danger: DangerDSLType
declare function warn(params: string): void

const hasChangelog = danger.git.modified_files.includes("CHANGELOG.md")
if (!hasChangelog) {
  warn("Please add a changelog entry for your changes.")
}

import dtsGenerator from "./scripts/danger-dts"
const currentDTS = dtsGenerator()
const savedDTS = fs.readFileSync("source/danger.d.ts").toString()
if (currentDTS !== savedDTS) {
  const message = "There are changes to the Danger DSL which are not reflected in the current danger.d.ts."
  const idea = "Please run <code>yarn declarations</code> and update this PR."
  fail(`${message}<br/><i>${idea}</i>`)
}

// Always ensure we name all CI providers in the README. These
// regularly get forgotten on a PR adding a new one.
const sentence = danger.utils.sentence

import { realProviders } from "./source/ci_source/providers"
const readme = fs.readFileSync("README.md").toString()
const names = realProviders.map(p => new p({}).name)
const missing = names.filter(n => !readme.includes(n))
if (missing.length) {
  warn(`These providers are missing from the README: ${sentence(missing)}`)
}