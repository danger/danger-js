// Because we don't get to use the d.ts, we can pass in a subset here.
// This means we can re-use the type infra from the app, without having to
// fake the import.

import {DangerDSL} from "./source/dsl/DangerDSL"
declare var danger: DangerDSL
declare function warn(params: string): void
declare function fail(params: string): void
declare function message(params: string): void
declare function markdown(params: string): void
declare function schedule(promise: () => Promise<any | void>): void

import * as fs from "fs"
import * as child_process from "child_process"

// For some reason we're getting type errors on this includes module?
// Wonder if we could move to the includes function in ES2015?
import * as includesOriginal from "lodash.includes"
const includes = includesOriginal as Function

const sentence = danger.utils.sentence

// Request a CHANGELOG entry if not declared #trivial
const hasChangelog = includes(danger.git.modified_files, "changelog.md")
const isTrivial = includes((danger.github.pr.body + danger.github.pr.title), "#trivial")
if (!hasChangelog && !isTrivial) {
  warn("Please add a changelog entry for your changes.")

  // Politely ask for their name on the entry too
  const changelogDiff = danger.git.diffForFile("changelog.md")
  const contributorName = danger.github.pr.user.login
  if (changelogDiff && !includes(changelogDiff, contributorName)) {
    warn("Please add your GitHub name to the changelog entry, so we can attribute you correctly.")
  }
}

// Celebrate when a new release is being shipped
const checkForRelease = (packageDiff) => {
  if (packageDiff.version) {
    markdown(":tada:")
  }
}

// Initial stab at starting a new dependency information rule
// Just starting simple by showing `yarn why {dep}` for now

// This is a great candidate for being a Danger plugin.

const checkForNewDependencies = (packageDiff) => {
  if (packageDiff.dependencies) {
    if (packageDiff.dependencies.added.length) {
      const newDependencies = packageDiff.dependencies.added as string[]
      warn(`New dependencies added: ${sentence(newDependencies)}.`)

      newDependencies.forEach(dep => {
        const output = child_process.execSync(`yarn why ${dep} --json`)

        // Comes as a series of little JSON messages
        const usefulJSONContents = output.toString().split(`{"type":"activityEnd","data":{"id":0}}`).pop() as string
        const asJSON = usefulJSONContents.split("}\n{").join("},{")

        const whyJSON = JSON.parse(`[${asJSON}]`) as any[]
        const messages = whyJSON.filter(msg => typeof msg.data === "string")
        markdown(`
## ${dep}

${messages.join("\n\n - ")}
          `)
      })
    }
  }
}

// Ensure a lockfile change if deps/devDeps changes, in case
// someone has only used `npm install` instead of `yarn.

const checkForLockfileDiff = (packageDiff) => {
  if (packageDiff.dependencies || packageDiff.devDependencies) {
    const lockfileChanged = includes(danger.git.modified_files, "yarn.lock")
    if (!lockfileChanged) {
      const message = "Changes were made to package.json, but not to yarn.lock."
      const idea = "Perhaps you need to run `yarn install`?"
      warn(`${message}<br/><i>${idea}</i>`)
    }
  }
}

// Don't ship @types dependencies to consumers of Danger
const checkForTypesInDeps = (packageDiff) => {
  if (packageDiff.dependencies) {
    const typesDeps = packageDiff.dependencies.added.filter((dep: string) => dep.startsWith("@types"))
    if (typesDeps.length) {
      const message = `@types dependencies were added to package.json, as a dependency for others.`
      const idea = `You need to move ${sentence(typesDeps)} into "devDependencies"?`
      fail(`${message}<br/><i>${idea}</i>`)
    }
  }
}

// As `JSONDiffForFile` is an async function, we want to add it to Danger's scheduler
// then it can continue after eval has taken place.

schedule(async () => {
  const packageDiff = await danger.git.JSONDiffForFile("package.json")
  checkForRelease(packageDiff)
  checkForNewDependencies(packageDiff)
  checkForLockfileDiff(packageDiff)
  checkForTypesInDeps(packageDiff)
})

// Some good old-fashioned maintainance upkeep

// Ensure the danger.d.ts is always up to date inside this repo.
// This also serves as a way of being able to understand changes to the DSL
// in a way that doesn't require running Danger.

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
