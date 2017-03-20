// Because we don't get to use the d.ts, we can pass in a subset here.
import {DangerDSL} from "./source/dsl/DangerDSL"
declare var danger: DangerDSL
declare function warn(params: string): void
declare function fail(params: string): void
declare function markdown(params: string): void
declare function schedule(promise: () => Promise<any | void>): void

import * as fs from "fs"
import * as child_process from "child_process"

// For some reason we're getting type errors on this includes module?
// Wonder if we could move to the includes function in ES2015?
import * as includesOriginal from "lodash.includes"
const includes = includesOriginal as Function

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

import dtsGenerator from "./scripts/danger-dts"
const currentDTS = dtsGenerator()
const savedDTS = fs.readFileSync("source/danger.d.ts").toString()
if (currentDTS !== savedDTS) {
  const message = "There are changes to the Danger DSL which are not reflected in the current danger.d.ts."
  const idea = "Please run <code>yarn declarations</code> and update this PR."
  fail(`${message} - <i>${idea}</i>`)
}

// Initial stab at starting a new dependency information rule
// Just starting simple

schedule(async () => {
  const packageDiff = await danger.git.JSONDiffForFile("package.json")
  if (packageDiff.dependencies) {
    const newDependencies = packageDiff.dependencies.added as string[]
    warn(`New dependencies added: ${danger.utils.sentence(newDependencies)}.`)

    newDependencies.forEach(dep => {
      const {stdout, status} = child_process.spawnSync("yarn why ${dep} --json")
      if (status == 0) {
        const usefulJSONContents = stdout.toString().split(`{"type":"activityEnd","data":{"id":0}}`).pop()
        const whyJSON = JSON.parse(`[${usefulJSONContents}]`) as any[]
        markdown(`
### ${dep}

${whyJSON.map(why => why.data).join("\n\n")}
        `)
      }
    })
  }
})
