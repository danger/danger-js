import { contextForDanger, DangerContext } from "./Dangerfile"
import { CISource } from "../ci_source/ci_source"
import { Platform, Comment } from "../platforms/platform"
import {
  inlineResults,
  regularResults,
  mergeResults,
  DangerResults,
  DangerInlineResults,
  resultsIntoInlineResults,
  emptyDangerResults,
  inlineResultsIntoResults,
  sortResults,
  sortInlineResults,
  validateResults,
} from "../dsl/DangerResults"
import {
  template as githubResultsTemplate,
  inlineTemplate as githubResultsInlineTemplate,
  fileLineToString,
} from "./templates/githubIssueTemplate"
import {
  template as bitbucketServerTemplate,
  inlineTemplate as bitbucketServerInlineTemplate,
} from "./templates/bitbucketServerTemplate"
import exceptionRaisedTemplate from "./templates/exceptionRaisedTemplate"

import * as debug from "debug"
import chalk from "chalk"
import { sentence, href } from "./DangerUtils"
import { DangerRunner } from "./runners/runner"
import { jsonToDSL } from "./jsonToDSL"
import { jsonDSLGenerator } from "./dslGenerator"
import { GitDSL } from "../dsl/GitDSL"
import { DangerDSL } from "../dsl/DangerDSL"

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

    await this.handleResults(results, runtime.danger.git)
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
    return new DangerDSL(platformDSL, git, utils, this.platform.name)
  }

  /**
   * Handle the message aspects of running a Dangerfile
   *
   * @param {DangerResults} results a JSON representation of the end-state for a Danger run
   */
  async handleResults(results: DangerResults, git: GitDSL) {
    validateResults(results)

    this.d(`Got Results back, current settings`, this.options)
    if (this.options.stdoutOnly || this.options.jsonOnly) {
      await this.handleResultsPostingToSTDOUT(results)
    } else {
      await this.handleResultsPostingToPlatform(results, git)
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
   * @param {GitDSL} git a reference to a git implementation so that inline comments find diffs to work with
   */
  async handleResultsPostingToPlatform(results: DangerResults, git: GitDSL) {
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
      const previousComments = await this.platform.getInlineComments(dangerID)
      for (const comment of previousComments) {
        await this.deleteInlineComment(comment)
      }
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
      const previousComments = await this.platform.getInlineComments(dangerID)
      const inline = inlineResults(results)
      const inlineLeftovers = await this.sendInlineComments(inline, git, previousComments)
      const regular = regularResults(results)
      const mergedResults = sortResults(mergeResults(regular, inlineLeftovers))
      const comment = process.env["DANGER_BITBUCKETSERVER_HOST"]
        ? bitbucketServerTemplate(dangerID, mergedResults)
        : githubResultsTemplate(dangerID, mergedResults)

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
  sendInlineComments(results: DangerResults, git: GitDSL, previousComments: Comment[]): Promise<DangerResults> {
    if (!this.platform.supportsInlineComments) {
      return new Promise(resolve => resolve(results))
    }

    const inlineResults = resultsIntoInlineResults(results)
    const sortedInlineResults = sortInlineResults(inlineResults)

    // For every inline result check if there is a comment already
    // if there is - update it and remove comment from deleteComments array (comments prepared for deletion)
    // if there isn't - create a new comment
    // Leftovers in deleteComments array should all be deleted afterwards
    let deleteComments = previousComments.filter(c => c.ownedByDanger)
    let commentPromises: Promise<any>[] = []
    for (let inlineResult of sortedInlineResults) {
      const index = deleteComments.findIndex(p =>
        p.body.includes(fileLineToString(inlineResult.file, inlineResult.line))
      )
      let promise: Promise<any>
      if (index != -1) {
        let previousComment = deleteComments[index]
        delete deleteComments[index]
        promise = this.updateInlineComment(inlineResult, previousComment)
      } else {
        promise = this.sendInlineComment(git, inlineResult)
      }
      commentPromises.push(promise.then(_r => emptyDangerResults).catch(_e => inlineResultsIntoResults(inlineResult)))
    }
    deleteComments.forEach(comment => {
      let promise = this.deleteInlineComment(comment)
      commentPromises.push(promise.then(_r => emptyDangerResults).catch(_e => emptyDangerResults))
    })

    return Promise.all(commentPromises).then(dangerResults => {
      return new Promise<DangerResults>(resolve => {
        resolve(dangerResults.reduce((acc, r) => mergeResults(acc, r), emptyDangerResults))
      })
    })
  }

  async sendInlineComment(git: GitDSL, inlineResults: DangerInlineResults): Promise<any> {
    const comment = this.inlineCommentTemplate(inlineResults)
    return await this.platform.createInlineComment(git, comment, inlineResults.file, inlineResults.line)
  }

  async updateInlineComment(inlineResults: DangerInlineResults, previousComment: Comment): Promise<any> {
    const body = this.inlineCommentTemplate(inlineResults)
    // If generated body is exactly the same as current comment we don't send an API request
    if (body == previousComment.body) {
      return
    }

    return await this.platform.updateInlineComment(body, previousComment.id)
  }

  async deleteInlineComment(comment: Comment): Promise<any> {
    return await this.platform.deleteInlineComment(comment.id)
  }

  inlineCommentTemplate(inlineResults: DangerInlineResults): string {
    const results = inlineResultsIntoResults(inlineResults)
    const comment = process.env["DANGER_BITBUCKETSERVER_HOST"]
      ? bitbucketServerInlineTemplate(results)
      : githubResultsInlineTemplate(this.options.dangerID, results, inlineResults.file, inlineResults.line)

    return comment
  }

  /**
   * Takes an error (maybe a bad eval) and provides a DangerResults compatible object3ehguh.l;/////////////
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
