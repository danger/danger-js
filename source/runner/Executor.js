import Dangerfile from "../runner/Dangerfile"
import { DangerDSL } from "../dsl/DangerDSL"
import { Platform } from "../platforms/platform"
import type { Violation } from "../platforms/messaging/violation"

// This is still badly named, maybe it really should just be runner?

export default class Executor {
  ciSource: CISource
  platform: Platform

  constructor(ciSource: CISource, platform: Platform) {
    this.ciSource = ciSource
    this.platform = platform
  }

  async run() {
    const git = await this.platform.getReviewDiff()
    const pr = await this.platform.getReviewInfo()
    console.log("Got github deets")

    const dsl = new DangerDSL(pr, git)
    const dangerfile = new Dangerfile(dsl)
    const results = await dangerfile.run("dangerfile.js")
    console.log("Got results")

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
