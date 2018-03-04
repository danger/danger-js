import { contextForDanger, DangerContext } from "./Dangerfile"
import { DangerDSL, DangerDSLType } from "../dsl/DangerDSL"
import { CISource } from "../ci_source/ci_source"
import { Platform } from "../platforms/platform"
import {
  inlineResults,
  regularResults,
  mergeResults,
  DangerResults,
  DangerInlineResults,
  resultsIntoInlineResults,
  emptyDangerResults,
} from "../dsl/DangerResults"
import { template as githubResultsTemplate } from "./templates/githubIssueTemplate"
import exceptionRaisedTemplate from "./templates/exceptionRaisedTemplate"

import * as debug from "debug"
import chalk from "chalk"
import { sentence, href } from "./DangerUtils"
import { DangerRunner } from "./runners/runner"
import { jsonToDSL } from "./jsonToDSL"
import { jsonDSLGenerator } from "./dslGenerator"
import { GitDSL } from "../dsl/GitDSL"

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

  /** TODO: Next two functions aren't used in Danger, are they used in Peril? */

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

    await this.handleResults(results, runtime.danger)
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
  async handleResults(results: DangerResults, danger: DangerDSLType) {
    this.d(`Got Results back, current settings`, this.options)
    if (this.options.stdoutOnly || this.options.jsonOnly) {
      await this.handleResultsPostingToSTDOUT(results)
    } else {
      await this.handleResultsPostingToPlatform(results, danger)
    }
  }
  /**
   * Handle showing results inside the shell.
   *
   * @param {DangerResults} results a JSON representation of the end-state for a Danger run
   */
  async handleResultsPostingToSTDOUT(results: DangerResults) {
    const { fails, warnings, messages, markdowns } = results
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
      this.d("Writing to STDOUT:", results)
      // Human-readable format

      const table = [
        fails.length && { name: "Failures", messages: fails.map(f => f.message) },
        warnings.length && { name: "Warnings", messages: warnings.map(w => w.message) },
        messages.length && { name: "Messages", messages: messages.map(m => m.message) },
        markdowns.length && { name: "Markdowns", messages: markdowns },
      ].filter(r => r !== 0) as { name: string; messages: string[] }[]

      // Consider looking at getting the terminal width, and making it 60%
      // if over a particular size

      table.forEach(row => {
        console.log(`## ${chalk.bold(row.name)}`)
        console.log(row.messages.join(chalk.bold("\n-\n")))
      })

      if (fails.length > 0) {
        const s = fails.length === 1 ? "" : "s"
        const are = fails.length === 1 ? "is" : "are"
        const message = chalk.underline.red("Failing the build")
        console.log(`Danger: ${message}, there ${are} ${fails.length} fail${s}.`)
        process.exitCode = 1
      } else if (warnings.length > 0) {
        const message = chalk.underline("not failing the build")
        console.log(`Danger: Found only warnings, ${message}`)
      } else if (messages.length > 0) {
        console.log("Danger: Passed, found only messages.")
      } else if (!messages.length && !fails.length && !messages.length && !warnings.length) {
        console.log("Danger: Passed review, received no feedback.")
      }
    }
  }

  /**
   * Handle showing results inside a code review platform
   *
   * @param {DangerResults} results a JSON representation of the end-state for a Danger run
   */
  // TODO: Instead of danger, pass gitDSL
  async handleResultsPostingToPlatform(results: DangerResults, danger: DangerDSLType) {
    // Delete the message if there's nothing to say
    const { fails, warnings, messages, markdowns } = results

    const failureCount = [...fails, ...warnings].length
    const messageCount = [...messages, ...markdowns].length

    this.d("Posting to platform:", results)

    const dangerID = this.options.dangerID
    const failed = fails.length > 0
    const successPosting = await this.platform.updateStatus(!failed, messageForResults(results), this.ciSource.ciRunURL)
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
          this.d("Failing the build due to handleResultsPostingToPlatform not successfully setting a commit status")
          process.exitCode = 1
        }
      } else if (warnings.length > 0) {
        console.log("Found only warnings, not failing the build.")
      } else if (messageCount > 0) {
        console.log("Found only messages, passing those to review.")
      }

      let inline = inlineResults(results)
      let inlineLeftovers = await this.sendInlineComments(inline, danger.git)
      let regular = regularResults(results)
      let mergedResults = mergeResults(regular, inlineLeftovers)

      const comment = githubResultsTemplate(dangerID, mergedResults)
      await this.platform.updateOrCreateComment(dangerID, comment)
    }

    // More info, is more info.
    if (this.options.verbose) {
      await this.handleResultsPostingToSTDOUT(results)
    }
  }

  /**
   * Send inline comments
   * Returns these violations that didn't pass the validation (e.g. incorrect file/line)
   *
   * @param results Results with inline violations
   */
  sendInlineComments(results: DangerResults, git: GitDSL): Promise<DangerResults> {
    // TODO: Get current inline comments, if any of the old ones is not present
    // in the new ones - delete.
    return resultsIntoInlineResults(results).then(inlineResults => {
      let promises: Promise<DangerResults>[] = inlineResults.map(inlineResult => {
        return this.sendInlineComment(git, inlineResult)
          .then(_ => emptyDangerResults)
          .catch(_ => {
            return inlineResult.results
          })
      })
      return Promise.all(promises).then(results => {
        return new Promise<DangerResults>(resolve => {
          resolve(results.reduce((acc, r) => mergeResults(acc, r), emptyDangerResults))
        })
      })
    })
  }

  async sendInlineComment(git: GitDSL, inlineResults: DangerInlineResults): Promise<any> {
    let template = githubResultsTemplate(this.options.dangerID, inlineResults.results)
    return await this.platform.createInlineComment(git, template, inlineResults.file, inlineResults.line)
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
      markdowns: [{ message: exceptionRaisedTemplate(error) }],
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
