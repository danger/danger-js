// Note: Keep this ES6 only, want to be able to run this directly via node
// to ensure that something like ts-node doesn't mess up paths etc

// yarn test:fixtures

// Toggle this on to update the JSON files for each run
const writeResults = false

const fs = require("fs")
const child_process = require("child_process")
const { resolve } = require("path")
const { basename } = require("path")
const chalk = require("chalk")
const expect = require("expect")

const runnerFileJS = "distribution/commands/danger-runner.js"

// Use a DSL fixture, and emulate being the `danger ci` host process
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

let runCount = 0

console.log("Running Fixures for Danger JS. This uses the built version of danger.\n")

// Runs the danger runner over a fixture, then compares it to the
// fixtured JSON data
const runDangerfile = fixture => {
  let allLogs = ""
  const dangerfile = `${dangerFileFixtures}/${fixture}`
  const dangerfileResults = `${dangerFileResultsFixtures}/${fixture}.json`

  process.stdout.write(chalk.bold(basename(dangerfile)))

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
    // console.log(`stdout: ${data}`)

    const trimmed = data.trim()
    const maybeJSON = getJSONURLFromSTDOUT(data)
    const url = maybeJSON.replace("danger-results:/", "")
    const runtimeResults = JSON.parse(fs.readFileSync(url, "utf8"))
    if (writeResults) {
      fs.writeFileSync(dangerfileResults, trimmed)
    }

    const fixturedResults = JSON.parse(fs.readFileSync(dangerfileResults, "utf8"))
    // Fails include traces etc
    expect(runtimeResults).toEqual(fixturedResults)

    const tick = chalk.bold.greenBright("✓")
    process.stdout.write(" " + tick)

    runCount++
    next()
  })
}

/** Pulls out a URL that's from the STDOUT */
const getJSONURLFromSTDOUT = stdout => {
  const match = stdout.match(/danger-results:\/\/*.+json/)
  if (!match) {
    return undefined
  }
  return match[0]
}

// Keep an index and loop through the fixtures
var index = 0
const next = () => {
  const nextFixture = fixtures[index++]
  if (nextFixture) {
    if (index > 1) {
      process.stdout.write(", ")
    }
    runDangerfile(nextFixture)
  } else {
    expect(runCount).toEqual(fixtures.length)
  }
}

process.on("unhandledRejection", function(reason, _p) {
  console.log(chalk.red("Error: "), reason)
  process.exitCode = 1
})

next()
