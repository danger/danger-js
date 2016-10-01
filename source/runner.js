#! /usr/bin/env node
// @flow

var program = require("commander")
import {version} from "../package.json"

program
  .version(version)
  .option("-h, --head [commitish]", "TODO: Set the head commitish")
  .option("-b, --base [commitish]", "TODO: Set the base commitish")
  .option("-f, --fail-on-errors", "TODO: Fail on errors")
  .parse(process.argv)

// if (program.head) console.log("  - peppers")
// if (program.base) console.log("  - pineapple")
// if (program.fail_on_errors) console.log("  - bbq")

// console.log("  - %s cheese", program.cheese)
