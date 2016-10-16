import Dangerfile from "../runner/Dangerfile"
import DangerDSL from "../dsl/DangerDSL"
import { Platform } from "../platforms/platform"

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
    let dsl = new DangerDSL(pr, git)
    const dangerfile = new Dangerfile(dsl)
    dangerfile.run("dangerfile.js")
  }
}
