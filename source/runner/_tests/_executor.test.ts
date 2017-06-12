import { Executor } from "../Executor"
import { FakeCI } from "../../ci_source/providers/Fake"
import { FakePlatform } from "../../platforms/FakePlatform"
import { emptyResults, warnResults } from "./fixtures/ExampleDangerResults"

const defaultConfig = {
  stdoutOnly: false,
  verbose: false,
}

describe("setup", () => {
  it("gets diff / pr info in setup", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, defaultConfig)

    platform.getPlatformGitRepresentation = jest.fn()
    platform.getPlatformDSLRepresentation = jest.fn()
    platform.updateStatus = jest.fn()

    await exec.dslForDanger()
    expect(platform.getPlatformGitRepresentation).toBeCalled()
    expect(platform.getPlatformDSLRepresentation).toBeCalled()
  })

  it("gets diff / pr info / utils in setup", async () => {
    const exec = new Executor(new FakeCI({}), new FakePlatform(), defaultConfig)
    const dsl = await exec.dslForDanger()
    expect(dsl.git).toBeTruthy()
    expect(dsl.github).toBeTruthy()
    expect(dsl.utils).toBeTruthy()
  })

  it("Creates a DangerResults for a raising dangerfile", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, defaultConfig)

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
    const exec = new Executor(new FakeCI({}), platform, defaultConfig)
    platform.deleteMainComment = jest.fn()

    await exec.handleResults(emptyResults)
    expect(platform.deleteMainComment).toBeCalled()
  })

  it("Updates or Creates comments for warnings", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, defaultConfig)
    platform.updateOrCreateComment = jest.fn()

    await exec.handleResults(warnResults)
    expect(platform.updateOrCreateComment).toBeCalled()
  })
})
