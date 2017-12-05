import * as fs from "fs"

import { InitState } from "../danger-init"

const generateDangerfileState = () => ({
  hasCHANGELOG: fs.existsSync("CHANGELOG.md"),
  hasPrettier: fs.existsSync("node_modules/.bin/prettier") || fs.existsSync("node_modules/.bin/prettier.bin"),
})

export const generateDefaultDangerfile = (state: InitState) => {
  const dangerfileState = generateDangerfileState()
  let rules: string[] = []

  rules.push(descriptionRule)
  if (dangerfileState.hasCHANGELOG) {
    rules.push(changelogRule)
  }

  const dangerfile = `${createImport(state)}

  ${rules.join("\n")}
  `

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
const isTrivial = (danger.github.pr.body + danger.github.pr.title).includes('#trivial')

if (!hasChangelog && !isTrivial) {
  warn('Please add a changelog entry for your changes.')
}
`

export const descriptionRule = `
// Check for description
if (danger.github.pr.body.length < 10) {
  warn('Please include a description of your PR changes.');
}
`
