import cleanDangerfile from "../utils/cleanDangerfile"

describe("cleaning Dangerfiles", () => {
  it("also handles typescript style imports", () => {
    const before = `
import { danger, warn, fail, message } from 'danger'
import { danger, warn, fail, message } from "danger"
import { danger, warn, fail, message } from "danger";
import danger from "danger"
import danger from 'danger'
import danger from 'danger';
`
    const after = `
// Removed import
// Removed import
// Removed import
// Removed import
// Removed import
// Removed import
`
    expect(cleanDangerfile(before)).toEqual(after)
  })

  it("also handles require style imports", () => {
    const before = `
const { danger, warn, fail, message } = require('danger')
var { danger, warn, fail, message } = require("danger")
let { danger, warn, fail, message } = require('danger');
`
    const after = `
// Removed require
// Removed require
// Removed require
`
    expect(cleanDangerfile(before)).toEqual(after)
  })
})
