// @flow

import Executor from "../Executor"
import Fake from "../../ci_source/Fake"
import FakePlatform from "../../platforms/FakePlatform"
import type { DangerResults } from "../../runner/DangerResults"

const emptyResults: DangerResults = {
  fails: [],
  warnings: [],
  messages: [],
  markdowns: []
}

const warnResults: DangerResults = {
  fails: [],
  warnings: [{}],
  messages: [],
  markdowns: []
}

describe("setup", () => {
  it("gets diff / pr info in setup", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new Fake({}), platform)

    platform.getReviewDiff = jest.fn()
    platform.getReviewInfo = jest.fn()

    await exec.setup()
    expect(platform.getReviewDiff).toBeCalled()
    expect(platform.getReviewInfo).toBeCalled()
  })

  it("gets diff / pr info in setup", async () => {
    const exec = new Executor(new Fake({}), new FakePlatform())
    await exec.setup()
    expect(exec.dangerfile).toBeTruthy()
  })

  it("Deletes a post when there are no messages", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new Fake({}), platform)
    platform.deleteMainComment = jest.fn()

    exec.handleResults(emptyResults)
    expect(platform.deleteMainComment).toBeCalled()
  })

  it("Updates or Creates comments for warnings", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new Fake({}), platform)
    platform.updateOrCreateComment = jest.fn()

    exec.handleResults(warnResults)
    expect(platform.updateOrCreateComment).toBeCalled()
  })
})
