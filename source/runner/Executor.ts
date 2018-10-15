import { DangerContext } from "./Dangerfile"
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
  isEmptyResults,
} from "../dsl/DangerResults"
import {
  template as githubResultsTemplate,
  inlineTemplate as githubResultsInlineTemplate,
  fileLineToString,
  messageForResultWithIssues as githubMessageForResultWithIssues,
} from "./templates/githubIssueTemplate"
import {
  template as bitbucketServerTemplate,
  inlineTemplate as bitbucketServerInlineTemplate,
  messageForResultWithIssues as bitbucketMessageForResultWithIssues,
} from "./templates/bitbucketServerTemplate"
import exceptionRaisedTemplate from "./templates/exceptionRaisedTemplate"

import { debug } from "../debug"
import chalk from "chalk"
import { sentence, href } from "./DangerUtils"
import { DangerRunner } from "./runners/runner"
import { GitDSL } from "../dsl/GitDSL"
import { DangerDSL } from "../dsl/DangerDSL"

export interface ExecutorOptions {
  /** Should we do a text-only run? E.g. skipping comments */
  stdoutOnly: boolean
  /** Should the output be submitted as a JSON string? */
  jsonOnly: boolean
  /** Should Danger post as much info as possible */
  verbose: boolean
  /** A unique ID to handle multiple Danger runs */
  dangerID: string
  /** Is the access token from a GitHub App, and thus can have access to unique APIs (checks) without work */
  accessTokenIsGitHubApp?: boolean
}
// This is still badly named, maybe it really should just be runner?

export class Executor {
  private readonly d = debug("executor")

  constructor(
    public readonly ciSource: CISource,
    public readonly platform: Platform,
    public readonly runner: DangerRunner,
    public readonly options: ExecutorOptions
  ) {}

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
      results = await this.runner.runDangerfileEnvironment([file], [undefined], runtime)
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

    this.d("Got results back:", results)
    this.d(`Evaluator settings`, this.options)

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

      const tick = chalk.bold.greenBright("✓")
      const cross = chalk.bold.redBright("ⅹ")
      let output = ""

      if (fails.length > 0) {
        const s = fails.length === 1 ? "" : "s"
        const are = fails.length === 1 ? "is" : "are"
        const message = chalk.underline.red("Failing the build")
        output = `Danger: ${cross} ${message}, there ${are} ${fails.length} fail${s}.`
        process.exitCode = 1
      } else if (warnings.length > 0) {
        const message = chalk.underline("not failing the build")
        output = `Danger: ${tick} found only warnings, ${message}`
      } else if (messages.length > 0) {
        output = `Danger: ${tick} passed, found only messages.`
      } else if (!messages.length && !fails.length && !messages.length && !warnings.length) {
        output = `Danger: ${tick} passed review, received no feedback.`
      }

      const allMessages = [...fails, ...warnings, ...messages, ...markdowns].map(m => m.message)
      const oneMessage = allMessages.join("\n")
      const longMessage = oneMessage.split("\n").length > 30

      // For a short message, show the log at the top
      if (!longMessage) {
        // An empty blank line for visual spacing
        console.log(output)
      }

      const table = [
        fails.length && { name: "Failures", messages: fails.map(f => f.message) },
        warnings.length && { name: "Warnings", messages: warnings.map(w => w.message) },
        messages.length && { name: "Messages", messages: messages.map(m => m.message) },
        markdowns.length && { name: "Markdowns", messages: markdowns.map(m => m.message) },
      ].filter(r => r !== 0) as { name: string; messages: string[] }[]

      // Consider looking at getting the terminal width, and making it 60%
      // if over a particular size

      table.forEach(row => {
        console.log(`## ${chalk.bold(row.name)}`)
        console.log(row.messages.join(chalk.bold("\n-\n")))
      })

      // For a long message show the results at the bottom
      if (longMessage) {
        console.log("")
        console.log(output)
      }

      // An empty blank line for visual spacing
      console.log("")
    }
  }

  /**
   * Handle showing results inside a code review platform
   *
   * @param {DangerResults} results a JSON representation of the end-state for a Danger run
   * @param {GitDSL} git a reference to a git implementation so that inline comments find diffs to work with
   */
  async handleResultsPostingToPlatform(originalResults: DangerResults, git: GitDSL) {
    // Allow a platform to say "I can do something special with this" - the example case for this
    // is the GitHub Checks API. It doesn't have an API that feels like commenting, so
    // it allows transforming the results after doing its work.
    let results = originalResults
    if (this.platform.platformResultsPreMapper) {
      this.d("Running platformResultsPreMapper:", this.platform.platformResultsPreMapper)
      results = await this.platform.platformResultsPreMapper(results, this.options)
      this.d("Received results from platformResultsPreMapper:", results)
    }

    const { fails, warnings, messages, markdowns } = results

    const failureCount = [...fails, ...warnings].length
    const messageCount = [...messages, ...markdowns].length

    this.d("Posting to platform:", results)

    const dangerID = this.options.dangerID
    const failed = fails.length > 0

    let issueURL = undefined

    if (failureCount + messageCount === 0) {
      console.log("No issues or messages were sent. Removing any existing messages.")
      await this.platform.deleteMainComment(dangerID)
      const previousComments = await this.platform.getInlineComments(dangerID)
      for (const comment of previousComments) {
        if (comment) {
          await this.deleteInlineComment(comment)
        }
      }
    } else {
      if (fails.length > 0) {
        const s = fails.length === 1 ? "" : "s"
        const are = fails.length === 1 ? "is" : "are"
        console.log(`Failing the build, there ${are} ${fails.length} fail${s}.`)
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

      // If danger have no comments other than inline to update. Just delete previous main comment.
      if (isEmptyResults(mergedResults)) {
        this.platform.deleteMainComment(dangerID)
      } else {
        const comment = process.env["DANGER_BITBUCKETSERVER_HOST"]
          ? bitbucketServerTemplate(dangerID, mergedResults)
          : githubResultsTemplate(dangerID, mergedResults)

        issueURL = await this.platform.updateOrCreateComment(dangerID, comment)
        console.log(`Feedback: ${issueURL}`)
      }
    }

    const urlForInfo = issueURL || this.ciSource.ciRunURL
    const successPosting = await this.platform.updateStatus(!failed, messageForResults(results), urlForInfo)
    if (!successPosting && this.options.verbose) {
      console.log("Could not add a commit status, the GitHub token for Danger does not have access rights.")
      console.log("If the build fails, then danger will use a failing exit code.")
    }

    if (!successPosting && failed) {
      this.d("Failing the build due to handleResultsPostingToPlatform not successfully setting a commit status")
      process.exitCode = 1
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
  sendInlineComments(results: DangerResults, git: GitDSL, previousComments: Comment[] | null): Promise<DangerResults> {
    if (!this.platform.supportsInlineComments) {
      return new Promise(resolve => resolve(results))
    }

    const inlineResults = resultsIntoInlineResults(results)
    const sortedInlineResults = sortInlineResults(inlineResults)

    // For every inline result check if there is a comment already
    // if there is - update it and remove comment from deleteComments array (comments prepared for deletion)
    // if there isn't - create a new comment
    // Leftovers in deleteComments array should all be deleted afterwards
    let deleteComments = Array.isArray(previousComments) ? previousComments.filter(c => c.ownedByDanger) : []
    let commentPromises: Promise<any>[] = []
    for (let inlineResult of sortedInlineResults) {
      const index = deleteComments.findIndex(p =>
        p.body.includes(fileLineToString(inlineResult.file, inlineResult.line))
      )
      let promise: Promise<any>
      if (index != -1) {
        let previousComment = deleteComments[index]
        deleteComments.splice(index, 1)
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
      ? bitbucketServerInlineTemplate(this.options.dangerID, results, inlineResults.file, inlineResults.line)
      : githubResultsInlineTemplate(this.options.dangerID, results, inlineResults.file, inlineResults.line)

    return comment
  }

  /**
   * Takes an error (maybe a bad eval) and provides a DangerResults compatible object
   * @param error Any JS error
   */
  resultsForError(error: Error) {
    // Need a failing error, otherwise it won't fail CI.
    console.error(chalk.red("Danger has failed to run"))
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
    return process.env["DANGER_BITBUCKETSERVER_HOST"]
      ? bitbucketMessageForResultWithIssues
      : githubMessageForResultWithIssues
  }
}
