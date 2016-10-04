var program = require("commander")

import { version } from "../../package.json"

// Provides the root node to the command-line architecture

program
  .version(version)
  .command("run", "Runs danger on your local system", {isDefault: true})
  .command("init", "Creates a new Dangerfile.js")
  .command("local", "Runs your changes against ")

export default program
