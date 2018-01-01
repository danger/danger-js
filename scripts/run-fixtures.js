// Note: Keep this ES6 only, want to be able to run this directly via node
// to ensur that something like ts-node doesn't mess up paths etc

// yarn build; cat source/_tests/fixtures/danger-js-pr-395.json | env DANGER_FAKE_CI="YEP" DANGER_TEST_REPO='danger/danger-js' DANGER_TEST_PR='395' node --inspect distribution/commands/danger-runner.js --text-only --dangerfile /Users/orta/dev/projects/danger/danger-js/source/runner/_tests/fixtures/__DangerfileAsync.js

const fs = require("fs")
const child_process = require("child_process")
const { resolve } = require("path")
const chalk = require("chalk")
const expect = require("expect")

// Toggle this on to update the JSON files for each run
const writeResults = false
console.log("If this script fails, you probably want to update the fixtures - just edit script/run-fixtures.js")
const runnerFileJS = "distribution/commands/danger-runner.js"

// Get all the fixtures
const dangerDSLFixture = resolve(__dirname, "../source/_tests/fixtures/danger-js-pr-395.json")
const dslJSON = fs.readFileSync(dangerDSLFixture, "utf8")

// Folders for the details
const dangerFileFixtures = resolve(__dirname, "../source/runner/_tests/fixtures/")
const dangerFileResultsFixtures = resolve(__dirname, "../source/runner/_tests/fixtures/results")

const fixtures = fs
  .readdirSync(dangerFileFixtures, "utf8")
  .filter(f => f.includes("__"))
  .filter(f => !f.includes("Throws"))
  .filter(f => !f.includes("BadSyntax"))

// Runs the danger runner over a fixture, then compares it to the
// fixtured JSON data
const runDangerfile = fixture => {
  let allLogs = ""
  const dangerfile = `${dangerFileFixtures}/${fixture}`
  const dangerfileResults = `${dangerFileResultsFixtures}/${fixture}.json`

  console.log("Running fixture for " + chalk.bold(dangerfile))

  // Setup the command
  const commandArgs = ["node", runnerFileJS, "--text-only", "--dangerfile", dangerfile]
  const env = {
    DANGER_FAKE_CI: "YEP",
    DANGER_TEST_REPO: "danger/danger",
    DANGER_TEST_PR: "395",
    DANGER_GITHUB_API_TOKEN: "1234",
    DEBUG: "danger",
  }
  const command = commandArgs.join(" ")

  const child = child_process.exec(command, { env: Object.assign({}, process.env, env) })
  child.stdin.write(dslJSON)
  child.stdin.end()

  child.stderr.on("data", data => {
    console.log(`stderr: ${data}`)
  })

  child.stdout.on("data", data => {
    data = data.toString()
    const trimmed = data.trim()
    if (trimmed.startsWith("{") && trimmed.endsWith("}") && trimmed.includes("markdowns")) {
      const runtimeResults = JSON.parse(trimmed)

      if (writeResults) {
        fs.writeFileSync(dangerfileResults, trimmed)
      }

      const fixturedResults = JSON.parse(fs.readFileSync(dangerfileResults, "utf8"))
      // Fails include traces etc
      expect(runtimeResults).toEqual(fixturedResults)

      next()
    } else {
      allLogs += data
    }
  })
}

// Keep an index and loop through the fixtures
var index = 0
const next = () => {
  const nextFixture = fixtures[index++]
  if (nextFixture) {
    runDangerfile(nextFixture)
  }
}

process.on("unhandledRejection", function(reason, _p) {
  console.log(chalk.red("Error: "), reason)
  process.exitCode = 1
})

next()
