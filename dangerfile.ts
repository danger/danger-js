// Because we don't get to use the d.ts, we can pass in a subset here.
// This means we can re-use the type infra from the app, without having to
// fake the import.

import yarn from "danger-plugin-yarn"
import jest from "danger-plugin-jest"

import { DangerDSLType } from "./source/dsl/DangerDSL"
declare const danger: DangerDSLType
// declare var results: any
declare function warn(message: string, file?: string, line?: number): void
declare function fail(params: string): void
// declare function message(params: string): void
// declare function markdown(params: string): void
// declare function schedule(promise: Promise<any | void>): void
// declare function schedule(promise: () => Promise<any | void>): void
// declare function schedule(callback: (resolve: any) => void): void

export default async () => {
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

  // Some libraries
  await yarn()
  await jest()

  // Don't have folks setting the package json version
  const packageDiff = await danger.git.JSONDiffForFile("package.json")
  if (packageDiff.version && danger.github.pr.user.login !== "orta") {
    fail("Please don't make package version changes")
  }

  danger.github.setSummaryMarkdown("Looking good")
}

// Re-run the git push hooks
import "./dangerfile.lite"
