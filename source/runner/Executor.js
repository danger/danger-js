import Dangerfile from "../runner/Dangerfile"
import type { DangerResults } from "../runner/Dangerfile" // eslint-disable-line no-duplicate-imports
import { DangerDSL } from "../dsl/DangerDSL"
import { Platform } from "../platforms/platform"
import type { Violation } from "../platforms/messaging/violation"

// This is still badly named, maybe it really should just be runner?

export default class Executor {
  ciSource: CISource
  platform: Platform

  dangerfile: Dangerfile

  constructor(ciSource: CISource, platform: Platform) {
    this.ciSource = ciSource
    this.platform = platform
  }

  /** Sets up all the related objects for running the Dangerfile
  * @returns {void} It's a promise, so a void promise
  */
  async setup() : void {
    const git = await this.platform.getReviewDiff()
    const pr = await this.platform.getReviewInfo()
    const dsl = new DangerDSL(pr, git)
    this.dangerfile = new Dangerfile(dsl)
  }

  /**
   * Runs the current dangerfile
   * @returns {DangerResults} Returns the results of the Danger run
   * */
  async run() : DangerResults {
    return await this.dangerfile.run("dangerfile.js")
  }

  /**
   * Handle the messaing aspects of running a Dangerfile
   * @returns {void} It's a promise, so a void promise
   * @param {DangerResults} results a JSON representation of the end-state for a Danger run
   */
  async handleResults(results: DangerResults): void {
    if (results.fails.length) {
      process.exitCode = 1
      const fails = results.fails.map((fail: Violation) => fail.message)
      const comment = fails.join("<br/>")
      this.platform.updateOrCreateComment(comment)
      console.log("Failed.")
    } else {
      this.platform.deleteMainComment()
      console.log("All Good.")
    }
  }
}
