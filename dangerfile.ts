// Because we don't get to use the d.ts, we can pass in a subset here.
// This means we can re-use the type infra from the app, without having to
// fake the import.

import { DangerDSL } from "./source/dsl/DangerDSL"
declare var danger: DangerDSL
declare var results: any
declare function warn(params: string): void
declare function fail(params: string): void
declare function message(params: string): void
declare function markdown(params: string): void
declare function schedule(promise: () => Promise<any | void>): void
declare function schedule(callback: (resolve) => void): void

import * as fs from "fs"
import * as child_process from "child_process"
import { distanceInWords } from "date-fns"

// For some reason we're getting type errors on this includes module?
// Wonder if we could move to the includes function in ES2015?
import * as includes from "lodash.includes"
const sentence = danger.utils.sentence

schedule(async () => {
  // Request a CHANGELOG entry if not declared #trivial
  const hasChangelog = includes(danger.git.modified_files, "changelog.md")
  const isTrivial = includes(danger.github.pr.body + danger.github.pr.title, "#trivial")
  const isGreenkeeper = danger.github.pr.user.login === "greenkeeper"

  if (!hasChangelog && !isTrivial && !isGreenkeeper) {
    warn("Please add a changelog entry for your changes.")

    // Politely ask for their name on the entry too
    const changelogDiff = await danger.git.diffForFile("changelog.md")
    const contributorName = danger.github.pr.user.login
    if (changelogDiff && !includes(changelogDiff.diff, contributorName)) {
      warn("Please add your GitHub name to the changelog entry, so we can attribute you correctly.")
    }
  }
})

import yarn from "danger-plugin-yarn"
schedule(yarn())

// Some good old-fashioned maintainance upkeep

// Ensure the danger.d.ts is always up to date inside this repo.
// This also serves as the "one true DSL" for a Danger run against a PR
// which tools can then work against.

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

import { realProviders } from "./source/ci_source/providers"
import Fake from "./source/ci_source/providers/Fake"
const readme = fs.readFileSync("README.md").toString()
const names = realProviders.map(p => new p({}).name)
const missing = names.filter(n => !readme.includes(n))
if (missing.length) {
  warn(`These providers are missing from the README: ${sentence(missing)}`)
}
