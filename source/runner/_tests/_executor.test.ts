import { Executor } from "../Executor"
import { FakeCI } from "../../ci_source/providers/Fake"
import { FakePlatform } from "../../platforms/FakePlatform"
import { emptyResults, warnResults } from "./fixtures/ExampleDangerResults"

const defaultConfig = {
  stdoutOnly: false,
  verbose: false
}

describe("setup", () => {
  it("gets diff / pr info in setup", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(platform, defaultConfig)

    platform.getPlatformGitRepresentation = jest.fn()
    platform.getPlatformDSLRepresentation = jest.fn()

    await exec.dslForDanger()
    expect(platform.getPlatformGitRepresentation).toBeCalled()
    expect(platform.getPlatformDSLRepresentation).toBeCalled()
  })

  it("gets diff / pr info in setup", async () => {
    const exec = new Executor(new FakePlatform(), defaultConfig)
    const dsl = await exec.dslForDanger()
    expect(dsl.git).toBeTruthy()
    expect(dsl.github).toBeTruthy()
  })

  it("Deletes a post when there are no messages", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(platform, defaultConfig)
    platform.deleteMainComment = jest.fn()

    await exec.handleResults(emptyResults)
    expect(platform.deleteMainComment).toBeCalled()
  })

  it("Updates or Creates comments for warnings", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(platform, defaultConfig)
    platform.updateOrCreateComment = jest.fn()

    await exec.handleResults(warnResults)
    expect(platform.updateOrCreateComment).toBeCalled()
  })
})
