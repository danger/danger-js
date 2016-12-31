// @flow

import Executor from "../Executor"
import Fake from "../../ci_source/providers/Fake"
import FakePlatform from "../../platforms/FakePlatform"
import { emptyResults, warnResults } from "./fixtures/ExampleDangerResults"

describe("setup", () => {
  it("gets diff / pr info in setup", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new Fake({}), platform)

    platform.getReviewDiff = jest.fn()
    platform.getReviewInfo = jest.fn()

    await exec.dslForDanger()
    expect(platform.getReviewDiff).toBeCalled()
    expect(platform.getReviewInfo).toBeCalled()
  })

  it("gets diff / pr info in setup", async () => {
    const exec = new Executor(new Fake({}), new FakePlatform())
    const dsl = await exec.dslForDanger()
    expect(dsl.git).toBeTruthy()
    expect(dsl.github).toBeTruthy()
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
