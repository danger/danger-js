import cleanDangerfile from "../utils/cleanDangerfile"

describe("cleaning Dangerfiles", () => {
  it("also handles typescript style imports", () => {
    const before = `
import { danger, fail, markdown, schedule, warn, message, results } from "danger";

import {
  danger,
  fail,
  markdown,
  schedule,
  warn,
  message,
  results,
} from "danger";

import danger = require("danger");

import { danger, warn, fail, message } from 'danger'
import { danger, warn, fail, message } from "danger"
import { danger, warn, fail, message } from "danger";
import danger from "danger"
import danger from 'danger'
import danger from 'danger';
`
    expect(cleanDangerfile(before)).toMatchInlineSnapshot(`
"
// Removed import { danger, fail, markdown, schedule, warn, message, results } from \\"danger\\";

// Removed import {
//   danger,
//   fail,
//   markdown,
//   schedule,
//   warn,
//   message,
//   results,
// } from \\"danger\\";

// Removed import danger = require(\\"danger\\");

// Removed import { danger, warn, fail, message } from 'danger'
// Removed import { danger, warn, fail, message } from \\"danger\\"
// Removed import { danger, warn, fail, message } from \\"danger\\";
// Removed import danger from \\"danger\\"
// Removed import danger from 'danger'
// Removed import danger from 'danger';
"
`)
  })

  it("also handles require style imports", () => {
    const before = `
const { danger, fail, warn } = require('danger');
const fs = require('fs')
const {danger} = require("danger");
const {
  danger,
  fail,
  markdown,
  schedule,
  warn,
  message,
  results,
} = require("danger");
let Danger = require("danger");
var D = require("danger");
`
    expect(cleanDangerfile(before)).toMatchInlineSnapshot(`
"
// Removed require; Original:  const { danger, fail, warn } = require('danger');
// Removed require; Original:  const fs = require('fs')
// const {danger} = require(\\"danger\\");
// Removed require; Original:  const {
//   danger,
//   fail,
//   markdown,
//   schedule,
//   warn,
//   message,
//   results,
// } = require(\\"danger\\");
// Removed require; Original:  let Danger = require(\\"danger\\");
// Removed require; Original:  var D = require(\\"danger\\");
"
`)
  })
})
