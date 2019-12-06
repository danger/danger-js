#! /usr/bin/env node

import program from "commander"
import { debug } from "../debug"
import prettyjson from "prettyjson"

import { FakeCI } from "../ci_source/providers/Fake"
import { pullRequestParser } from "../platforms/pullRequestParser"
import { dangerfilePath } from "./utils/fileUtils"
import validateDangerfileExists from "./utils/validateDangerfileExists"
import setSharedArgs, { SharedCLI } from "./utils/sharedDangerfileArgs"
import { jsonDSLGenerator } from "../runner/dslGenerator"
import { prepareDangerDSL } from "./utils/runDangerSubprocess"
import { runRunner } from "./ci/runner"
import { Platform, getPlatformForEnv } from "../platforms/platform"
import { CISource } from "../ci_source/ci_source"
import { getGitLabAPICredentialsFromEnv } from "../platforms/gitlab/GitLabAPI"

const d = debug("pr")
const log = console.log

interface App extends SharedCLI {
  /** Should we show the Danger Process PR JSON? */
  json?: boolean
  /** Should we show a more human readable for of the PR JSON? */
  js?: boolean
}

const gitLabApiCredentials = getGitLabAPICredentialsFromEnv(process.env)

program
  .usage("[options] <pr_url>")
  .description("Emulate running Danger against an existing GitHub Pull Request.")
  .option("-J, --json", "Output the raw JSON that would be passed into `danger process` for this PR.")
  .option("-j, --js", "A more human-readable version of the JSON.")

  .on("--help", () => {
    log("\n")
    log("  Docs:")
    if (
      !process.env["DANGER_GITHUB_API_TOKEN"] &&
      !process.env["DANGER_BITBUCKETSERVER_HOST"] &&
      !process.env["DANGER_BITBUCKETCLOUD_OAUTH_KEY"] &&
      !process.env["DANGER_BITBUCKETCLOUD_USERNAME"] &&
      !gitLabApiCredentials.token
    ) {
      log("")
      log(
        "     You don't have a DANGER_GITHUB_API_TOKEN/DANGER_GITLAB_API_TOKEN/DANGER_BITBUCKETCLOUD_OAUTH_KEY/DANGER_BITBUCKETCLOUD_USERNAME set up, this is optional, but TBH, you want to do this."
      )
      log("     Check out: http://danger.systems/js/guides/the_dangerfile.html#working-on-your-dangerfile")
      log("")
    }
    log("")
    log("    -> API Reference")
    log("       http://danger.systems/js/reference.html")
    log("")
    log("    -> Getting started:")
    log("       http://danger.systems/js/guides/getting_started.html")
    log("")
    log("    -> The Dangerfile")
    log("       http://danger.systems/js/guides/the_dangerfile.html")
  })

setSharedArgs(program).parse(process.argv)

const app = (program as any) as App
const customProcess = !!app.process

if (program.args.length === 0) {
  console.error("Please include a PR URL to run against")
  process.exitCode = 1
} else {
  const customHost =
    process.env["DANGER_GITHUB_HOST"] || process.env["DANGER_BITBUCKETSERVER_HOST"] || gitLabApiCredentials.host // this defaults to https://gitlab.com

  // Allow an ambiguous amount of args to find the PR reference
  const findPR = program.args.find(a => a.includes(customHost) || a.includes("github") || a.includes("bitbucket.org"))

  if (!findPR) {
    console.error(`Could not find an arg which mentioned GitHub, BitBucket Server, BitBucket Cloud, or GitLab.`)
    process.exitCode = 1
  } else {
    const pr = pullRequestParser(findPR)
    if (!pr) {
      console.error(`Could not get a repo and a PR number from your PR: ${findPR}, bad copy & paste?`)
      process.exitCode = 1
    } else {
      // TODO: Use custom `fetch` in GitHub that stores and uses local cache if PR is closed, these PRs
      //       shouldn't change often and there is a limit on API calls per hour.

      const isJSON = app.js || app.json
      const note = isJSON ? console.error : console.log
      note(`Starting Danger PR on ${pr.repo}#${pr.pullRequestNumber}`)

      if (customProcess || isJSON || validateDangerfileExists(dangerfilePath(program))) {
        if (!customProcess) {
          d(`executing dangerfile at ${dangerfilePath(program)}`)
        }
        const source = new FakeCI({ DANGER_TEST_REPO: pr.repo, DANGER_TEST_PR: pr.pullRequestNumber })
        const platform = getPlatformForEnv(
          {
            ...process.env,
            // Inject a platform hint, its up to getPlatformForEnv to decide if the environment is suitable for the
            // requested platform. Because we have a URL we can determine with greater accuracy what platform that the
            // user is attempting to test. This complexity is required because danger-pr defaults to using
            // un-authenticated GitHub where typically when using FakeCI we want to use Fake(Platform) e.g. when running
            // danger-local
            DANGER_PR_PLATFORM: pr.platform,
          },
          source
        )

        if (isJSON) {
          d("getting just the JSON/JS DSL")
          runHalfProcessJSON(platform, source)
        } else {
          d("running process separated Danger")
          // Always post to STDOUT in `danger-pr`
          app.textOnly = true

          // Can't send these to `danger runner`
          delete app.js
          delete app.json
          runRunner(app, { source, platform, additionalEnvVars: { DANGER_LOCAL_NO_CI: "yep" } })
        }
      }
    }
  }
}

// Run the first part of a Danger Process and output the JSON to CLI
async function runHalfProcessJSON(platform: Platform, source: CISource) {
  const dangerDSL = await jsonDSLGenerator(platform, source, program)
  // Truncate the access token
  if (dangerDSL.settings.github && dangerDSL.settings.github.accessToken) {
    dangerDSL.settings.github.accessToken = dangerDSL.settings.github.accessToken.substring(0, 4) + "..."
  }

  const processInput = prepareDangerDSL(dangerDSL)
  const output = JSON.parse(processInput)

  if (app.json) {
    process.stdout.write(JSON.stringify(output, null, 2))
  } else if (app.js) {
    console.log(prettyjson.render(output))
  }
}
