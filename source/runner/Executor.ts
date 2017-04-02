import { contextForDanger } from "../runner/Dangerfile"
import { DangerDSL } from "../dsl/DangerDSL"
import { Platform } from "../platforms/platform"
import { DangerResults } from "../dsl/DangerResults"
import { template as githubResultsTemplate } from "./templates/githubIssueTemplate"
import { createDangerfileRuntimeEnvironment, runDangerfileEnvironment } from "./DangerfileRunner"
import { DangerfileRuntimeEnv } from "./types"

import * as debug from "debug"
import * as chalk from "chalk"
import { sentence, href } from "./DangerUtils"

// This is still badly named, maybe it really should just be runner?

export interface ExecutorOptions {
  /** Should we do a text-only run? E.g. skipping comments */
  stdoutOnly: boolean,
  /** Should Danger post as much info as possible */
  verbose: boolean
}

export class Executor {
  private readonly d = debug("danger:executor")

  constructor(public readonly platform: Platform, public readonly options: ExecutorOptions) {
  }

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
  async setupDanger(): Promise<DangerfileRuntimeEnv> {
    const dsl = await this.dslForDanger()
    const context = contextForDanger(dsl)
    return await createDangerfileRuntimeEnvironment(context)
  }

  /**
   *  Runs all of the operations for a running just Danger
   * @param {string} file the filepath to the Dangerfile
   * @returns {Promise<DangerResults>} The results of the Danger run
   */

  async runDanger(file: string, runtime: DangerfileRuntimeEnv) {
    const results = await runDangerfileEnvironment(file, runtime)
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
    if (this.options.stdoutOnly) {
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
    const {fails, warnings, messages, markdowns} = results

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

  /**
   * Handle showing results inside a code review platform
   *
   * @param {DangerResults} results a JSON representation of the end-state for a Danger run
   */
  async handleResultsPostingToPlatform(results: DangerResults) {
    // Delete the message if there's nothing to say
    const {fails, warnings, messages, markdowns} = results

    const failureCount = [...fails, ...warnings].length
    const messageCount = [...messages, ...markdowns].length

    this.d(results)

    if (failureCount + messageCount === 0) {
      console.log("No issues or messages were sent. Removing any existing messages.")
      await this.platform.deleteMainComment()

    } else {
      if (fails.length > 0) {
        const s = fails.length === 1 ? "" : "s"
        const are = fails.length === 1 ? "is" : "are"
        console.log(`Failing the build, there ${are} ${fails.length} fail${s}.`)
        process.exitCode = 1

      } else if (warnings.length > 0) {
        console.log("Found only warnings, not failing the build.")

      } else if (messageCount > 0) {
        console.log("Found only messages, passing those to review.")
      }
      const comment = githubResultsTemplate(results)
      await this.platform.updateOrCreateComment(comment)
    }

    // More info, is more info.
    if (this.options.verbose) {
      await this.handleResultsPostingToSTDOUT(results)
    }
  }
}
