import Dangerfile from "../runner/Dangerfile"
import DangerDSL from "../dsl/DangerDSL"
import { Platform } from "../platforms/platform"
import type { Violation } from "../platforms/messaging/violation"

// This is still badly named, maybe it really sbhould just be runner?

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
    const dsl = new DangerDSL(pr, git)
    const dangerfile = new Dangerfile(dsl)
    const results = await dangerfile.run("dangerfile.js")

    if (results.fails.length) {
      process.exitCode = 1
      const fails = results.fails.map((fail: Violation) => fail.message)
      this.platform.updateOrCreateComment(fails.join("<br/>"))
    } else {
      this.platform.deleteMainComment()
      console.log("All Good.")
    }
  }
}
