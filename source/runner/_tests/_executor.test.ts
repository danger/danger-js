import { Executor } from "../Executor"
import { FakeCI } from "../../ci_source/providers/Fake"
import { FakePlatform } from "../../platforms/FakePlatform"
import { emptyResults, warnResults, failsResults } from "./fixtures/ExampleDangerResults"
import inlineRunner from "../runners/inline"

const defaultConfig = {
  stdoutOnly: false,
  verbose: false,
  jsonOnly: false,
}

describe("setup", () => {
  it("gets diff / pr info in setup", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig)

    platform.getPlatformGitRepresentation = jest.fn()
    platform.getPlatformDSLRepresentation = jest.fn()

    await exec.dslForDanger()
    expect(platform.getPlatformGitRepresentation).toBeCalled()
    expect(platform.getPlatformDSLRepresentation).toBeCalled()
  })

  it("gets diff / pr info / utils in setup", async () => {
    const exec = new Executor(new FakeCI({}), new FakePlatform(), inlineRunner, defaultConfig)
    const dsl = await exec.dslForDanger()
    expect(dsl.git).toBeTruthy()
    expect(dsl.github).toBeTruthy()
    expect(dsl.utils).toBeTruthy()
  })

  it("Creates a DangerResults for a raising dangerfile", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig)

    // This is a real error occuring when Danger modifies the Dangerfile
    // as it is given a path of ""
    const error = {
      name: "Error",
      message: "ENOENT: no such file or directory",
    }

    const results = await exec.runDanger("", {} as any)
    expect(results.fails.length).toBeGreaterThan(0)

    const markdown = results.markdowns[0]
    expect(markdown).toMatch(error.name)
    expect(markdown).toMatch(error.message)
  })

  it("Deletes a post when there are no messages", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig)
    platform.deleteMainComment = jest.fn()

    await exec.handleResults(emptyResults)
    expect(platform.deleteMainComment).toBeCalled()
  })

  it("Updates or Creates comments for warnings", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig)
    platform.updateOrCreateComment = jest.fn()

    await exec.handleResults(warnResults)
    expect(platform.updateOrCreateComment).toBeCalled()
  })

  it("Updates or Creates comments for warnings", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig)
    platform.updateOrCreateComment = jest.fn()

    await exec.handleResults(warnResults)
    expect(platform.updateOrCreateComment).toBeCalled()
  })

  it("Updates the status with success for a passed results", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig)
    platform.updateOrCreateComment = jest.fn()
    platform.updateStatus = jest.fn()

    await exec.handleResults(warnResults)
    expect(platform.updateStatus).toBeCalledWith(
      true,
      "⚠️ Danger found some issues. Don't worry, everything is fixable."
    )
  })

  it("Updates the status with success for a passed results", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig)
    platform.updateOrCreateComment = jest.fn()
    platform.updateStatus = jest.fn()

    await exec.handleResults(failsResults)
    expect(platform.updateStatus).toBeCalledWith(
      false,
      "⚠️ Danger found some issues. Don't worry, everything is fixable."
    )
  })
})
