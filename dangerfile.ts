// Because we don't get to use the d.ts, we can pass in a subset here.
// This means we can re-use the type infra from the app, without having to
// fake the import.

import { DangerDSLType } from "./source/dsl/DangerDSL"
declare var danger: DangerDSLType
// declare var results: any
declare function warn(params: string): void
// declare function fail(params: string): void
// declare function message(params: string): void
// declare function markdown(params: string): void
// declare function schedule(promise: Promise<any | void>): void
// declare function schedule(promise: () => Promise<any | void>): void
// declare function schedule(callback: (resolve: any) => void): void

const checkREADME = async () => {
  if (!danger.github) {
    return
  }

  // Request a CHANGELOG entry if not declared #trivial
  const hasChangelog = danger.git.modified_files.includes("CHANGELOG.md")
  const isTrivial = (danger.github.pr.body + danger.github.pr.title).includes("#trivial")
  const isUser = danger.github!.pr.user.type === "User"

  // Politely ask for their name on the entry too
  if (!hasChangelog && !isTrivial && !isUser) {
    const changelogDiff = await danger.git.diffForFile("CHANGELOG.md")
    const contributorName = danger.github.pr.user.login
    if (changelogDiff && changelogDiff.diff.includes(contributorName)) {
      warn("Please add your GitHub name to the changelog entry, so we can attribute you correctly.")
    }
  }
}
checkREADME()

import yarn from "danger-plugin-yarn"
yarn()

import jest from "danger-plugin-jest"
jest()

// Re-run the git push hooks
import "./dangerfile.lite"
