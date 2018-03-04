import { Executor } from "../Executor"
import { FakeCI } from "../../ci_source/providers/Fake"
import { FakePlatform } from "../../platforms/FakePlatform"
import { emptyResults, warnResults, inlineWarnResults, failsResults } from "./fixtures/ExampleDangerResults"
import inlineRunner from "../runners/inline"
import { jsonDSLGenerator } from "../dslGenerator"
import { jsonToDSL } from "../jsonToDSL"
import { DangerDSLType } from "../../dsl/DangerDSL"
import { singleViolationSingleFileResults } from "../../dsl/_tests/fixtures/ExampleDangerResults"

const defaultConfig = {
  stdoutOnly: false,
  verbose: false,
  jsonOnly: false,
  dangerID: "123",
}

let defaultDsl = (platform): Promise<DangerDSLType> => {
  return jsonDSLGenerator(platform).then(jsonDSL => {
    jsonDSL.github = {
      pr: { number: 1, base: { sha: "321" }, head: { sha: "123", repo: { full_name: "123" } } },
    } as any
    return jsonToDSL(jsonDSL)
  })
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
    const dsl = await defaultDsl(platform)

    // This is a real error occuring when Danger modifies the Dangerfile
    // as it is given a path of ""
    const error = {
      name: "Error",
      message: "ENOENT: no such file or directory",
    }

    const results = await exec.runDanger("", { danger: dsl } as any)
    expect(results.fails.length).toBeGreaterThan(0)

    const markdown = results.markdowns[0].message
    expect(markdown).toMatch(error.name)
    expect(markdown).toMatch(error.message)
  })

  it("Deletes a post when there are no messages", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig)
    const dsl = await defaultDsl(platform)
    platform.deleteMainComment = jest.fn()

    await exec.handleResults(emptyResults, dsl)
    expect(platform.deleteMainComment).toBeCalled()
  })

  it("Updates or Creates comments for warnings", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig)
    const dsl = await defaultDsl(platform)
    platform.updateOrCreateComment = jest.fn()

    await exec.handleResults(warnResults, dsl)
    expect(platform.updateOrCreateComment).toBeCalled()
  })

  it("Updates or Creates comments for warnings", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig)
    const dsl = await defaultDsl(platform)
    platform.updateOrCreateComment = jest.fn()

    await exec.handleResults(warnResults, dsl)
    expect(platform.updateOrCreateComment).toBeCalled()
  })

  it("Sends inline comments and returns regular results for failures", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig)
    const dsl = await defaultDsl(platform)
    const apiFailureMock = jest.fn().mockReturnValue(new Promise<any>((resolve, reject) => reject()))
    platform.createInlineComment = apiFailureMock

    let results = await exec.sendInlineComments(singleViolationSingleFileResults, dsl.git)
    expect(results).toEqual(singleViolationSingleFileResults)
  })

  it("Creates an inline comment for warning", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig)
    const dsl = await defaultDsl(platform)
    platform.createInlineComment = jest.fn()
    platform.updateOrCreateComment = jest.fn()

    await exec.handleResults(inlineWarnResults, dsl)
    expect(platform.createInlineComment).toBeCalled()
  })

  it("Updates the status with success for a passed results", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig)
    const dsl = await defaultDsl(platform)
    platform.updateOrCreateComment = jest.fn()
    platform.updateStatus = jest.fn()

    await exec.handleResults(warnResults, dsl)
    expect(platform.updateStatus).toBeCalledWith(
      true,
      "⚠️ Danger found some issues. Don't worry, everything is fixable.",
      undefined
    )
  })

  it("Updates the status with success for failing results", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig)
    const dsl = await defaultDsl(platform)
    platform.updateOrCreateComment = jest.fn()
    platform.updateStatus = jest.fn()

    await exec.handleResults(failsResults, dsl)
    expect(platform.updateStatus).toBeCalledWith(
      false,
      "⚠️ Danger found some issues. Don't worry, everything is fixable.",
      undefined
    )
  })

  it("Passes the URL from a platform to the updateStatus", async () => {
    const platform = new FakePlatform()
    const ci: any = new FakeCI({})
    ci.ciRunURL = "https://url.com"

    const exec = new Executor(ci, platform, inlineRunner, defaultConfig)
    const dsl = await defaultDsl(platform)
    platform.updateOrCreateComment = jest.fn()
    platform.updateStatus = jest.fn()

    await exec.handleResults(failsResults, dsl)
    expect(platform.updateStatus).toBeCalledWith(expect.anything(), expect.anything(), ci.ciRunURL)
  })
})
