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

const fails = 2
// Add a message to the table
message(`You have added 2 more modules to the app`)

//  Adds a warning to the table
warn("You have not included a CHANGELOG entry.")

// Declares a blocking
fail(`ESLint has failed with ${fails} failed files.`)

import { getNPMMetadataForDep } from "danger-plugin-yarn"
schedule(async () => {
  const data = await getNPMMetadataForDep("danger")

  // Show markdown under the table:
  markdown("## New module Danger" + data)
})
