// @flow
// This is needed so that other files can use async funcs
import "babel-polyfill"

// import app from "./app"
import { version } from "../../package.json"
var program = require("commander")

// Provides the root node to the command-line architecture

program
  .version(version)
  .command("run", "Runs danger on your local system", {isDefault: true})
  .command("init", "Creates a new Dangerfile.js")
  .command("local", "Runs your changes against ")

console.log("pre?")
program.parse(process.argv)
console.log("post?")
