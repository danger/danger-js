import * as fs from "fs"

import { InitState } from "../danger-init"

const generateDangerfileState = () => ({
  hasCHANGELOG: fs.existsSync("CHANGELOG.md"),
  hasSeparateTestFolder: fs.existsSync("tests"),
  hasPrettier: fs.existsSync("node_modules/.bin/prettier") || fs.existsSync("node_modules/.bin/prettier.bin"),
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

  if (!dangerfileState.hasSeparateTestFolder) {
    if (fs.existsSync("src")) {
      rules.push(checkSeparateTestsFolder("src"))
    } else if (fs.existsSync("lib")) {
      rules.push(checkSeparateTestsFolder("lib"))
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
    return format(dangerfile)
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
const hasChangelog = danger.git.modified_files.includes('CHANGELOG.md')
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
export const checkSeparateTestsFolder = (src: string) => `
// Request changes to ${src} also include changes to tests.

const allChangedFiles = danger.git.modified_files.concat(danger.git.created_files)
const modifiedAppFiles = allChangedFiles.filter(p => includes(p, '${src}/'))
const modifiedTestFiles = allChangedFiles.filter(p => includes(p, 'test/'))

const hasAppChanges = modifiedAppFiles.length > 0;
const hasTestChanges = modifiedTestFiles.length > 0;
if (hasAppChanges && !hasTestChanges) {
  warn('This PR does not include any changes to tests, even though it affects app code.');
}
`
