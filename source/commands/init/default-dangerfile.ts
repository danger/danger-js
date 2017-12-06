import * as fs from "fs"
import { InitState } from "./interfaces"

const generateDangerfileState = () => ({
  hasCHANGELOG: fs.existsSync("CHANGELOG.md"),
  hasSeparateTestFolder: fs.existsSync("tests") || fs.existsSync("specs"),
  hasPrettier: fs.existsSync("node_modules/.bin/prettier") || fs.existsSync("node_modules/.bin/prettier.bin"),
  hasJest: fs.existsSync("node_modules/.bin/jest") || fs.existsSync("node_modules/.bin/jest.bin"),
})

export const generateDefaultDangerfile = (state: InitState) => {
  const dangerfileState = generateDangerfileState()
  let rules: string[] = []

  rules.push(descriptionRule)

  if (dangerfileState.hasCHANGELOG) {
    rules.push(changelogRule)
  }

  if (!state.isAnOSSRepo) {
    rules.push(assignSomeone)
  }

  if (dangerfileState.hasSeparateTestFolder || dangerfileState.hasJest) {
    const tests = dangerfileState.hasJest ? "__tests__" : "tests"
    const source = ["src", "source", "lib"].filter(path => fs.existsSync(path))
    if (source[0]) {
      rules.push(checkSeparateTestsFolder(source[0], tests))
    }
  }

  const dangerfile = `${createImport(state)}

  ${rules.join("\n")}
  `
  return formatDangerfile(dangerfile, dangerfileState)
}

export const formatDangerfile = (dangerfile: string, dangerfileState: any) => {
  if (dangerfileState.hasPrettier) {
    // tslint:disable-next-line:no-require-imports
    const { format } = require("prettier")
    // Get package settings
    const localPrettier = fs.existsSync("package.json") && JSON.parse(fs.readFileSync("package.json", "utf8")).prettier
    // Always include this
    const always = { editorconfig: true }
    const settings = localPrettier ? { ...always, ...localPrettier } : always

    return format(dangerfile, settings)
  } else {
    return dangerfile
  }
}

export const createImport = (state: InitState) => {
  if (state.isTypeScript || state.isBabel) {
    return "import {danger, warn} from 'danger'"
  } else {
    return "const {danger, warn} = require('danger')"
  }
}

export const changelogRule = `
// Check for a CHANGELOG entry
const hasChangelog = danger.git.modified_files.some(f => f === 'CHANGELOG.md')
const description = danger.github.pr.body + danger.github.pr.title
const isTrivial = description.includes('#trivial')

if (!hasChangelog && !isTrivial) {
  warn('Please add a changelog entry for your changes.')
}
`

export const descriptionRule = `
// No PR is too small to include a decription of why you made a change
if (danger.github.pr.body.length < 10) {
  warn('Please include a description of your PR changes.');
}
`

export const assignSomeone = `
// Check that someone has been assigned to this PR
if (danger.github.pr.assignee === null) {
   warn('Please assign someone to merge this PR, and optionally include people who should review.');
}
`
// For projects not using Jest
export const checkSeparateTestsFolder = (src: string, tests: string) => `
// Request changes to ${src} also include changes to tests.
const allFiles = danger.git.modified_files.concat(danger.git.created_files)
const hasAppChanges = allFiles.some(p => includes(p, '${src}/'))
const hasTestChanges = allFiles.some(p => includes(p, '${tests}/'))

if (hasAppChanges && !hasTestChanges) {
  warn('This PR does not include changes to tests, even though it affects app code.');
}
`
