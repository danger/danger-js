import { contextForDanger, DangerContext } from "../runner/Dangerfile"
import { DangerDSL } from "../dsl/DangerDSL"
import { CISource } from "../ci_source/ci_source"
import { Platform } from "../platforms/platform"
import { DangerResults } from "../dsl/DangerResults"
import { template as githubResultsTemplate } from "./templates/githubIssueTemplate"
import exceptionRaisedTemplate from "./templates/exceptionRaisedTemplate"

import * as debug from "debug"
import chalk from "chalk"
import { sentence, href } from "./DangerUtils"
import { DangerRunner } from "./runners/runner"
import { jsonToDSL } from "./jsonToDSL"
import { jsonDSLGenerator } from "./dslGenerator"

// This is still badly named, maybe it really should just be runner?

export interface ExecutorOptions {
  /** Should we do a text-only run? E.g. skipping comments */
  stdoutOnly: boolean
  /** Should the output be submitted as a JSON string? */
  jsonOnly: boolean
  /** Should Danger post as much info as possible */
  verbose: boolean
  /** A unique ID to handle multiple Danger runs */
  dangerID: string
}

export class Executor {
  private readonly d = debug("danger:executor")

  constructor(
    public readonly ciSource: CISource,
    public readonly platform: Platform,
    public readonly runner: DangerRunner,
    public readonly options: ExecutorOptions
  ) {}

  /** Mainly just a dumb helper because I can't do
   * async functions in danger-run.js
   * @param {string} file the path to run Danger from
   * @returns {Promise<DangerResults>} The results of the Danger run
   */
  async setupAndRunDanger(file: string) {
    const runtimeEnv = await this.setupDanger()
    return await this.runDanger(file, runtimeEnv)
  }

  /**
   *  Runs all of the operations for a running just Danger
   * @returns {DangerfileRuntimeEnv} A runtime environment to run Danger in
   */
  async setupDanger(): Promise<DangerContext> {
    const dsl = await jsonDSLGenerator(this.platform)
    const realDSL = await jsonToDSL(dsl)
    const context = contextForDanger(realDSL)
    return await this.runner.createDangerfileRuntimeEnvironment(context)
  }

  /**
   *  Runs all of the operations for a running just Danger
   * @param {string} file the filepath to the Dangerfile
   * @returns {Promise<DangerResults>} The results of the Danger run
   */

  async runDanger(file: string, runtime: DangerContext) {
    let results = {} as DangerResults

    // If an eval of the Dangerfile fails, we should generate a
    // message that can go back to the CI
    try {
      results = await this.runner.runDangerfileEnvironment(file, undefined, runtime)
    } catch (error) {
      results = this.resultsForError(error)
    }

    await this.handleResults(results)
    return results
  }

  /**
   * Sets up all the related objects for running the Dangerfile
   * @returns {void} It's a promise, so a void promise
   */
  async dslForDanger(): Promise<DangerDSL> {
    const git = await this.platform.getPlatformGitRepresentation()
    const platformDSL = await this.platform.getPlatformDSLRepresentation()
    const utils = { sentence, href }
    return new DangerDSL(platformDSL, git, utils)
  }

  /**
   * Handle the message aspects of running a Dangerfile
   *
   * @param {DangerResults} results a JSON representation of the end-state for a Danger run
   */
  async handleResults(results: DangerResults) {
    if (this.options.stdoutOnly || this.options.jsonOnly) {
      this.handleResultsPostingToSTDOUT(results)
    } else {
      this.handleResultsPostingToPlatform(results)
    }
  }
  /**
   * Handle showing results inside the shell.
   *
   * @param {DangerResults} results a JSON representation of the end-state for a Danger run
   */
  async handleResultsPostingToSTDOUT(results: DangerResults) {
    const { fails, warnings, messages, markdowns } = results
    process.exitCode = fails.length > 0 ? 1 : 0

    if (this.options.jsonOnly) {
      // Format for Danger Process
      const results = {
        fails,
        warnings,
        messages,
        markdowns,
      }
      process.stdout.write(JSON.stringify(results, null, 2))
    } else {
      // Human-readable format

      const table = [
        { name: "Failures", messages: fails.map(f => f.message) },
        { name: "Warnings", messages: warnings.map(w => w.message) },
        { name: "Messages", messages: messages.map(m => m.message) },
        { name: "Markdowns", messages: markdowns },
      ]

      // Consider looking at getting the terminal width, and making it 60%
      // if over a particular size

      table.forEach(row => {
        console.log(`## ${chalk.bold(row.name)}`)
        console.log(row.messages.join(chalk.bold("\n-\n")))
      })

      if (fails.length > 0) {
        const s = fails.length === 1 ? "" : "s"
        const are = fails.length === 1 ? "is" : "are"
        const message = chalk.underline("Failing the build")
        console.log(`${message}, there ${are} ${fails.length} fail${s}.`)
        process.exitCode = 1
      } else if (warnings.length > 0) {
        const message = chalk.underline("not failing the build")
        console.log(`Found only warnings, ${message}`)
      } else if (messages.length > 0) {
        console.log("Found only messages, passing those to review.")
      }
    }
  }

  /**
   * Handle showing results inside a code review platform
   *
   * @param {DangerResults} results a JSON representation of the end-state for a Danger run
   */
  async handleResultsPostingToPlatform(results: DangerResults) {
    // Delete the message if there's nothing to say
    const { fails, warnings, messages, markdowns } = results

    const failureCount = [...fails, ...warnings].length
    const messageCount = [...messages, ...markdowns].length

    this.d(results)

    const dangerID = this.options.dangerID
    const failed = fails.length > 0
    const successPosting = await this.platform.updateStatus(!failed, messageForResults(results))
    if (this.options.verbose) {
      console.log("Could not add a commit status, the GitHub token for Danger does not have access rights.")
      console.log("If the build fails, then danger will use a failing exit code.")
    }

    if (failureCount + messageCount === 0) {
      console.log("No issues or messages were sent. Removing any existing messages.")
      await this.platform.deleteMainComment(dangerID)
    } else {
      if (fails.length > 0) {
        const s = fails.length === 1 ? "" : "s"
        const are = fails.length === 1 ? "is" : "are"
        console.log(`Failing the build, there ${are} ${fails.length} fail${s}.`)
        if (!successPosting) {
          process.exitCode = 1
        }
      } else if (warnings.length > 0) {
        console.log("Found only warnings, not failing the build.")
      } else if (messageCount > 0) {
        console.log("Found only messages, passing those to review.")
      }
      const comment = githubResultsTemplate(dangerID, results)
      await this.platform.updateOrCreateComment(dangerID, comment)
    }

    // More info, is more info.
    if (this.options.verbose) {
      await this.handleResultsPostingToSTDOUT(results)
    }
  }

  /**
   * Takes an error (maybe a bad eval) and provides a DangerResults compatible object
   * @param error Any JS error
   */
  resultsForError(error: Error) {
    // Need a failing error, otherwise it won't fail CI.
    console.error(chalk.red("Danger has errored"))
    console.error(error)
    return {
      fails: [{ message: "Running your Dangerfile has Failed" }],
      warnings: [],
      messages: [],
      markdowns: [exceptionRaisedTemplate(error)],
    }
  }
}

const compliment = () => {
  const compliments = ["Well done.", "Congrats.", "Woo!", "Yay.", "Jolly good show.", "Good on 'ya.", "Nice work."]
  return compliments[Math.floor(Math.random() * compliments.length)]
}

const messageForResults = (results: DangerResults) => {
  if (!results.fails.length && !results.warnings.length) {
    return `All green. ${compliment()}`
  } else {
    return "⚠️ Danger found some issues. Don't worry, everything is fixable."
  }
}
