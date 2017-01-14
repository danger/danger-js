#! /usr/bin/env node

// import app from "./app"
import { version } from "../../package.json"
import * as program from "commander"
import * as debug from "debug"

const d = debug("danger:runner")

d(`argv: ${process.argv}`)

// Provides the root node to the command-line architecture
program
  .version(version)
  .command("run", "Runs danger on your local system", {isDefault: true})
  .command("init", "Creates a new Dangerfile.js")
  .command("local", "Runs your changes against ")

program.on("--help", () => {
  console.log(
`These environment variables are available for customization

    DANGER_GITHUB_API_TOKEN:string  => Github api token for danger status post
    DANGER_TEST_REPO:string         => Repo slug to test danger against
    DANGER_TEST_PR:number           => PR number to test danger against
    DANGER_TIMESTAMP:any            => Display timestamp in danger template
    DANGER_FAKE_CI:any              => Run danger with fake CI provider
    DANGER_VERBOSE:any              => Verbose console output
`)
})

program.parse(process.argv)