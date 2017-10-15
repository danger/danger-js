// Because we don't get to use the d.ts, we can pass in a subset here.
// This means we can re-use the type infra from the app, without having to
// fake the import.

// console.log(global)
// console.log(require)
// console.log(require.extensions)

import { DangerDSL } from "./source/dsl/DangerDSL"
declare var danger: DangerDSL
// declare var results: any
declare function warn(params: string): void
declare function fail(params: string): void
// declare function message(params: string): void
// declare function markdown(params: string): void
declare function schedule(promise: Promise<any | void>): void
declare function schedule(promise: () => Promise<any | void>): void
declare function schedule(callback: (resolve: any) => void): void

import * as fs from "fs"

schedule(async () => {
  // Request a CHANGELOG entry if not declared #trivial
  const hasChangelog = danger.git.modified_files.includes("changelog.md")
  const isTrivial = (danger.github.pr.body + danger.github.pr.title).includes("#trivial")
  const isGreenkeeper = danger.github.pr.user.login === "greenkeeper"

  if (!hasChangelog && !isTrivial && !isGreenkeeper) {
    warn("Please add a changelog entry for your changes.")

    // Politely ask for their name on the entry too
    const changelogDiff = await danger.git.diffForFile("changelog.md")
    const contributorName = danger.github.pr.user.login
    if (changelogDiff && changelogDiff.diff.includes(contributorName)) {
      warn("Please add your GitHub name to the changelog entry, so we can attribute you correctly.")
    }
  }
})

import yarn from "danger-plugin-yarn"
schedule(yarn())

import jest from "danger-plugin-jest"
jest()

// Some good old-fashioned maintainance upkeep

// Ensure the danger.d.ts is always up to date inside this repo.
// This also serves as the "one true DSL" for a Danger run against a PR
// which tools can then work against.

// debugger

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
