import { contextForDanger } from "../runner/Dangerfile"
import { DangerDSL } from "../dsl/DangerDSL"
import { CISource } from "../ci_source/ci_source"
import { Platform } from "../platforms/platform"
import { DangerResults } from "../dsl/DangerResults"
import { template as githubResultsTemplate } from "./templates/github-issue-template"
import { createDangerfileRuntimeEnvironment, runDangerfileEnvironment } from "./DangerfileRunner"
import { DangerfileRuntimeEnv } from "./types"

// This is still badly named, maybe it really should just be runner?

export class Executor {
  constructor(public readonly ciSource: CISource, public readonly platform: Platform) {
  }

  /** Mainly just a dumb helper because I can't do
   * async functions in danger-run.js
   * @param {string} file the path to run Danger from
   * @returns {void} It's a promise, so a void promise
   */
  async setupAndRunDanger(file: string) {
    const runtimeEnv = await this.setupDanger()
    await this.runDanger(file, runtimeEnv)
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
   * @returns {void} It's a promise, so a void promise
   */

  async runDanger(file: string, runtime: DangerfileRuntimeEnv) {
    const results = await runDangerfileEnvironment(file, runtime)
    await this.handleResults(results)
  }

  /** Sets up all the related objects for running the Dangerfile
  * @returns {void} It's a promise, so a void promise
  */
  async dslForDanger(): Promise<DangerDSL> {
    const git = await this.platform.getReviewDiff()
    const pr = await this.platform.getReviewInfo()
    return new DangerDSL(pr, git)
  }

  /**
   * Handle the messaing aspects of running a Dangerfile
   * @param {DangerResults} results a JSON representation of the end-state for a Danger run
   * @returns {void} It's a promise, so a void promise
   */
  async handleResults(results: DangerResults) {
    // Ensure process fails if there are fails
    if (results.fails.length) {
      process.exitCode = 1
    }

    // Delete the message if there's nothing to say
    const hasMessages =
      results.fails.length > 0 ||
      results.warnings.length > 0 ||
      results.messages.length > 0 ||
      results.markdowns.length > 0

    if (!hasMessages) {
      console.log("All Good.")
      await this.platform.deleteMainComment()
    } else {
      console.log("Failed")
      const comment = githubResultsTemplate(results)
      await this.platform.updateOrCreateComment(comment)
    }
  }
}
