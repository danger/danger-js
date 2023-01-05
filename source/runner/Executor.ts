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
import {
  template as bitbucketCloudTemplate,
  inlineTemplate as bitbucketCloudInlineTemplate,
  messageForResultWithIssues as bitbucketCloudMessageForResultWithIssues,
} from "./templates/bitbucketCloudTemplate"
import exceptionRaisedTemplate from "./templates/exceptionRaisedTemplate"

import { debug } from "../debug"
import chalk from "chalk"
import { sentence, href, compliment } from "./DangerUtils"
import { DangerRunner } from "./runners/runner"
import { GitDSL } from "../dsl/GitDSL"
import { DangerDSL } from "../dsl/DangerDSL"
import { emptyGitJSON } from "../platforms/github/GitHubGit"
import { writeFileSync } from "fs"

export interface ExecutorOptions {
  /** Should we do a text-only run? E.g. skipping comments */
  stdoutOnly: boolean
  /** Should the output be submitted as a JSON string? */
  jsonOnly: boolean
  /** Should Danger post as much info as possible */
  verbose: boolean
  /** A unique ID to handle multiple Danger runs */
  dangerID: string
  /** Don't send the entire JSON via STDIN, instead store it in tmp, and give the paths */
  passURLForDSL: boolean
  /** Disable Checks support in GitHub */
  disableGitHubChecksSupport?: boolean
  /** Fail if danger report contains failures */
  failOnErrors?: boolean
  /** Dont add danger check to PR */
  noPublishCheck?: boolean
  /** Ignore inline-comments that are in lines which were not changed */
  ignoreOutOfDiffComments: boolean
  /** Makes Danger post a new comment instead of editing its previous one */
  newComment?: boolean
  /** Removes all previous comment and create a new one in the end of the list */
  removePreviousComments?: boolean
}
// This is still badly named, maybe it really should just be runner?

const isTests = typeof jest === "object"

interface ExitCodeContainer {
  exitCode?: number
}

export class Executor {
  private readonly d = debug("executor")
  private readonly log = isTests ? () => "" : console.log
  private readonly logErr = isTests ? () => "" : console.error

  constructor(
    public readonly ciSource: CISource,
    public readonly platform: Platform,
    public readonly runner: DangerRunner,
    public readonly options: ExecutorOptions,
    public readonly process: ExitCodeContainer
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
      results = this.resultsForError(error as Error)
    }

    await this.handleResults(results, runtime.danger.git)
    return results
  }

  /**
   * Sets up all the related objects for running the Dangerfile
   * @returns {void} It's a promise, so a void promise
   */
  async dslForDanger(): Promise<DangerDSL> {
    // This checks if the CI source, and the platform support running on
    // an event that's not a PR
    const useSimpleDSL = this.platform.getPlatformReviewSimpleRepresentation && this.ciSource.useEventDSL
    this.d("Using full Danger DSL:", !useSimpleDSL)

    // Can't use the API to grab git metadata
    const git = useSimpleDSL ? emptyGitJSON() : await this.platform.getPlatformGitRepresentation()

    const getDSLFunc = useSimpleDSL
      ? this.platform.getPlatformReviewSimpleRepresentation
      : this.platform.getPlatformReviewDSLRepresentation

    const platformDSL = await getDSLFunc!()

    const utils = { sentence, href }
    return new DangerDSL(platformDSL, git, utils, this.platform.name)
  }

  /**
   * Handle the message aspects of running a Dangerfile
   *
   * @param {DangerResults} results a JSON representation of the end-state for a Danger run
   */
  async handleResults(results: DangerResults, git?: GitDSL) {
    this.d("Got results back:", results)
    if (!results) {
      throw new Error(
        "Got no results back from the Dangerfile evaluation, this is likely an issue with a custom sub-process exiting early."
      )
    }
    validateResults(results)

    this.d(`Evaluator settings`, this.options)

    if (this.options.stdoutOnly || this.options.jsonOnly || (this.ciSource && this.ciSource.useEventDSL)) {
      await this.handleResultsPostingToSTDOUT(results)
    } else {
      await this.handleResultsPostingToPlatform(results, git)
    }

    if (this.options.failOnErrors && results.fails.length > 0) {
      this.process.exitCode = 1
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
      } else if (warnings.length > 0) {
        const message = chalk.underline("not failing the build")
        output = `Danger: ${tick} found only warnings, ${message}`
      } else if (messages.length > 0) {
        output = `Danger: ${tick} passed, found only messages.`
      } else if (!messages.length && !fails.length && !messages.length && !warnings.length) {
        output = `Danger: ${tick} passed review, received no feedback.`
      }

      const allMessages = [...fails, ...warnings, ...messages, ...markdowns].map((m) => m.message)
      const oneMessage = allMessages.join("\n")
      const longMessage = oneMessage.split("\n").length > 30

      // For a short message, show the log at the top
      if (!longMessage) {
        // An empty blank line for visual spacing
        this.log(output)
      }

      const table = [
        fails.length && { name: "Failures", messages: fails.map((f) => f.message) },
        warnings.length && { name: "Warnings", messages: warnings.map((w) => w.message) },
        messages.length && { name: "Messages", messages: messages.map((m) => m.message) },
        markdowns.length && { name: "Markdowns", messages: markdowns.map((m) => m.message) },
      ].filter((r) => r !== 0) as { name: string; messages: string[] }[]

      // Consider looking at getting the terminal width, and making it 60%
      // if over a particular size

      table.forEach((row) => {
        this.log(`## ${chalk.bold(row.name)}`)
        this.log(row.messages.join(chalk.bold("\n-\n")))
      })

      // For a long message show the results at the bottom
      if (longMessage) {
        this.log("")
        this.log(output)
      }

      // An empty blank line for visual spacing
      this.log("")
    }
  }

  /**
   * Handle showing results inside a code review platform
   *
   * @param {DangerResults} results a JSON representation of the end-state for a Danger run
   * @param {GitDSL} git a reference to a git implementation so that inline comments find diffs to work with
   */
  async handleResultsPostingToPlatform(originalResults: DangerResults, git?: GitDSL) {
    // Allow a platform to say "I can do something special with this" - the example case for this
    // is the GitHub Checks API. It doesn't have an API that feels like commenting, so
    // it allows transforming the results after doing its work.
    let results = originalResults
    if (this.platform.platformResultsPreMapper) {
      this.d("Running platformResultsPreMapper:")
      results = await this.platform.platformResultsPreMapper(results, this.options, this.ciSource.commitHash)
      this.d("Received results from platformResultsPreMapper:", results)
    }

    const { fails, warnings, messages, markdowns } = results

    const failureCount = [...fails, ...warnings].length
    const messageCount = [...messages, ...markdowns].length

    this.d("Posting to platform:", results)

    const dangerID = this.options.dangerID
    const failed = fails.length > 0
    const hasMessages = failureCount + messageCount > 0

    let issueURL = undefined

    if (!hasMessages || this.options.removePreviousComments) {
      if (process.env["DANGER_SKIP_WHEN_EMPTY"] === "true") {
        this.log(`Skip posting to platform ${this.platform.name}.`)
      } else {
        if (!hasMessages) {
          this.log(`Found no issues or messages from Danger. Removing any existing messages on ${this.platform.name}.`)
        } else {
          this.log(
            `'removePreviousComments' option specified. Removing any existing messages on ${this.platform.name}.`
          )
        }
        await this.platform.deleteMainComment(dangerID)
        const previousComments = await this.platform.getInlineComments(dangerID)
        for (const comment of previousComments) {
          if (comment && comment.ownedByDanger) {
            await this.deleteInlineComment(comment)
          }
        }
      }
    }

    if (hasMessages) {
      if (fails.length > 0) {
        const s = fails.length === 1 ? "" : "s"
        const are = fails.length === 1 ? "is" : "are"
        this.log(`Failing the build, there ${are} ${fails.length} fail${s}.`)
      } else if (warnings.length > 0) {
        this.log("Found only warnings, not failing the build.")
      } else if (messageCount > 0) {
        this.log("Found only messages, passing those to review.")
      }

      let mergedResults = regularResults(results)
      if (git !== undefined) {
        const previousComments = await this.platform.getInlineComments(dangerID)
        const inline = inlineResults(results)
        let inlineLeftovers = await this.sendInlineComments(inline, git, previousComments)
        inlineLeftovers = this.options.ignoreOutOfDiffComments ? emptyDangerResults : inlineLeftovers
        mergedResults = sortResults(mergeResults(mergedResults, inlineLeftovers))
      }

      // If danger have no comments other than inline to update. Just delete previous main comment.
      if (isEmptyResults(mergedResults)) {
        this.platform.deleteMainComment(dangerID)
      } else {
        let commitID
        if (this.ciSource.commitHash !== undefined) {
          commitID = this.ciSource.commitHash
        } else if (git !== undefined) {
          commitID = git.commits[git.commits.length - 1].sha
        }
        let comment
        if (process.env["DANGER_BITBUCKETSERVER_HOST"]) {
          comment = bitbucketServerTemplate(dangerID, mergedResults, commitID)
        } else if (process.env["DANGER_BITBUCKETCLOUD_OAUTH_KEY"] || process.env["DANGER_BITBUCKETCLOUD_USERNAME"]) {
          comment = bitbucketCloudTemplate(dangerID, mergedResults, commitID)
        } else {
          comment = githubResultsTemplate(dangerID, mergedResults, commitID)
        }

        if (this.options.newComment) {
          issueURL = await this.platform.createComment(dangerID, comment)
        } else {
          issueURL = await this.platform.updateOrCreateComment(dangerID, comment)
        }
        this.log(`Feedback: ${issueURL}`)
      }
    }

    if (!this.options.noPublishCheck) {
      await this.updatePrStatus(!failed, issueURL, results, dangerID)
    }

    // More info, is more info.
    if (this.options.verbose) {
      await this.handleResultsPostingToSTDOUT(results)
    }

    // Write to the GitHub Env if a sub-process has included a reference to github's job summary
    if (results.github?.stepSummary) {
      const filePath = process.env.GITHUB_STEP_SUMMARY
      if (!filePath) {
        throw new Error("process.env.GITHUB_STEP_SUMMARY was not set, which is needed for setSummaryMarkdown")
      }
      writeFileSync(filePath, results.github.stepSummary, "utf8")
    }
  }

  async updatePrStatus(
    passed: boolean | "pending",
    issueURL: string | undefined,
    results: DangerResults,
    dangerID: string
  ) {
    const urlForInfo = issueURL || this.ciSource.ciRunURL
    const successPosting = await this.platform.updateStatus(passed, messageForResults(results), urlForInfo, dangerID)

    if (!successPosting) {
      this.log("Could not add a commit status, the GitHub token for Danger does not have access rights.")
      this.log("If the build fails, then danger will use a failing exit code.")
    }

    if (!successPosting && !passed) {
      this.d("Failing the build due to handleResultsPostingToPlatform not successfully setting a commit status")
      process.exitCode = 1
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
      return new Promise((resolve) => resolve(results))
    }

    const inlineResults = resultsIntoInlineResults(results)
    const sortedInlineResults = sortInlineResults(inlineResults)

    let emptyResult: DangerResults = {
      messages: emptyDangerResults.messages,
      markdowns: emptyDangerResults.markdowns,
      fails: emptyDangerResults.fails,
      warnings: emptyDangerResults.warnings,
      meta: results.meta,
    }

    // For every inline result check if there is a comment already
    // if there is - update it and remove comment from deleteComments array (comments prepared for deletion)
    // if there isn't - create a new comment
    // Leftovers in deleteComments array should all be deleted afterwards
    let deleteComments = Array.isArray(previousComments) ? previousComments.filter((c) => c.ownedByDanger) : []
    let commentPromises: Promise<any>[] = []
    const inlineResultsForReview: DangerInlineResults[] = []
    for (let inlineResult of sortedInlineResults) {
      const index = deleteComments.findIndex((p) =>
        p.body.includes(fileLineToString(inlineResult.file, inlineResult.line))
      )
      let promise: Promise<any> | undefined = undefined
      if (index != -1) {
        let previousComment = deleteComments[index]
        deleteComments.splice(index, 1)
        promise = this.updateInlineComment(inlineResult, previousComment)
      } else {
        if (typeof this.platform.createInlineReview === "function") {
          inlineResultsForReview.push(inlineResult)
        } else {
          promise = this.sendInlineComment(git, inlineResult)
        }
      }
      if (promise) {
        commentPromises.push(
          promise.then((_r) => emptyDangerResults).catch((_e) => inlineResultsIntoResults(inlineResult))
        )
      }
    }
    deleteComments.forEach((comment) => {
      let promise = this.deleteInlineComment(comment)
      commentPromises.push(promise.then((_r) => emptyDangerResults).catch((_e) => emptyDangerResults))
    })

    return Promise.all([
      this.sendInlineReview(git, inlineResultsForReview)
        .then((_r) => emptyDangerResults)
        .catch((_e) =>
          inlineResultsForReview
            .map((inlineResult) => inlineResultsIntoResults(inlineResult))
            .reduce(mergeResults, emptyResult)
        ),
      ...commentPromises,
    ]).then((dangerResults) => {
      return new Promise<DangerResults>((resolve) => {
        resolve(dangerResults.reduce((acc, r) => mergeResults(acc, r), emptyResult))
      })
    })
  }

  async sendInlineReview(git: GitDSL, inlineResultsForReview: DangerInlineResults[]): Promise<any> {
    if (inlineResultsForReview.length === 0 || typeof this.platform.createInlineReview !== "function") {
      return emptyDangerResults
    }
    return await this.platform.createInlineReview(
      git,
      inlineResultsForReview.map((result) => ({
        comment: this.inlineCommentTemplate(result),
        path: result.file,
        line: result.line,
      }))
    )
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

    let comment
    if (process.env["DANGER_BITBUCKETSERVER_HOST"]) {
      comment = bitbucketServerInlineTemplate(this.options.dangerID, results, inlineResults.file, inlineResults.line)
    } else if (process.env["DANGER_BITBUCKETCLOUD_OAUTH_KEY"] || process.env["DANGER_BITBUCKETCLOUD_USERNAME"]) {
      comment = bitbucketCloudInlineTemplate(this.options.dangerID, results, inlineResults.file, inlineResults.line)
    } else {
      comment = githubResultsInlineTemplate(this.options.dangerID, results, inlineResults.file, inlineResults.line)
    }
    return comment
  }

  /**
   * Takes an error (maybe a bad eval) and provides a DangerResults compatible object
   * @param error Any JS error
   */
  resultsForError(error: Error) {
    // Need a failing error, otherwise it won't fail CI.
    this.logErr(chalk.red("Danger has failed to run"))
    this.logErr(error)
    return {
      fails: [{ message: "Running your Dangerfile has Failed" }],
      warnings: [],
      messages: [],
      markdowns: [{ message: exceptionRaisedTemplate(error) }],
    }
  }
}

const messageForResults = (results: DangerResults) => {
  if (!results.fails.length && !results.warnings.length) {
    return `All green. ${compliment()}`
  } else {
    if (process.env["DANGER_BITBUCKETSERVER_HOST"]) {
      return bitbucketMessageForResultWithIssues
    } else if (process.env["DANGER_BITBUCKETCLOUD_OAUTH_KEY"] || process.env["DANGER_BITBUCKETCLOUD_USERNAME"]) {
      return bitbucketCloudMessageForResultWithIssues
    } else {
      return githubMessageForResultWithIssues
    }
  }
}
