import { Executor, ExecutorOptions } from "../Executor"
import { FakeCI } from "../../ci_source/providers/Fake"
import { FakePlatform } from "../../platforms/FakePlatform"
import {
  emptyResults,
  failsResults,
  inlineFailResults,
  inlineMessageResults,
  inlineMultipleWarnResults,
  inlineMultipleWarnResults2,
  inlineWarnResults,
  warnResults,
} from "./fixtures/ExampleDangerResults"
import inlineRunner from "../runners/inline"
import { jsonDSLGenerator } from "../dslGenerator"
import { jsonToDSL } from "../jsonToDSL"
import { DangerDSLType } from "../../dsl/DangerDSL"
import { singleViolationSingleFileResults } from "../../dsl/_tests/fixtures/ExampleDangerResults"
import { inlineTemplate } from "../templates/githubIssueTemplate"
import { DangerResults, inlineResultsIntoResults, resultsIntoInlineResults } from "../../dsl/DangerResults"

const defaultConfig: ExecutorOptions = {
  stdoutOnly: false,
  verbose: false,
  jsonOnly: false,
  dangerID: "123",
  passURLForDSL: false,
  failOnErrors: false,
  noPublishCheck: false,
  ignoreOutOfDiffComments: false,
}

class FakeProcces {
  constructor(public exitCode: number = 0) {}
}

const fakeCI = new FakeCI({})

const defaultDsl = (platform: any): Promise<DangerDSLType> => {
  return jsonDSLGenerator(platform, fakeCI, {} as any).then((jsonDSL) => {
    jsonDSL.github = {
      pr: {
        number: 1,
        base: { sha: "321", repo: { full_name: "321" } },
        head: { sha: "123", repo: { full_name: "123" } },
      },
    } as any
    return jsonToDSL(jsonDSL, fakeCI)
  })
}

const mockPayloadForResults = (results: DangerResults): any => {
  return resultsIntoInlineResults(results).map((inlineResult) => {
    const comment = inlineTemplate(
      defaultConfig.dangerID,
      inlineResultsIntoResults(inlineResult),
      inlineResult.file,
      inlineResult.line
    )
    return { id: 1234, body: comment, ownedByDanger: true }
  })
}

describe("setup", () => {
  it("gets diff / pr info in setup", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig, new FakeProcces())

    platform.getPlatformGitRepresentation = jest.fn()
    platform.getPlatformReviewDSLRepresentation = jest.fn()

    await exec.dslForDanger()
    expect(platform.getPlatformGitRepresentation).toBeCalled()
    expect(platform.getPlatformReviewDSLRepresentation).toBeCalled()
  })

  it("gets diff / pr info / utils in setup", async () => {
    const exec = new Executor(new FakeCI({}), new FakePlatform(), inlineRunner, defaultConfig, new FakeProcces())
    const dsl = await exec.dslForDanger()
    expect(dsl.git).toBeTruthy()
    expect(dsl.github).toBeTruthy()
    expect(dsl.utils).toBeTruthy()
  })

  it("Creates a DangerResults for a raising dangerfile", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig, new FakeProcces())
    const dsl = await defaultDsl(platform)

    // This is a real error occurring when Danger modifies the Dangerfile
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
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig, new FakeProcces())
    const dsl = await defaultDsl(platform)
    platform.deleteMainComment = jest.fn()

    await exec.handleResults(emptyResults, dsl.git)
    expect(platform.deleteMainComment).toBeCalled()
  })

  it("Configure to Skip a post deletion when there are no messages", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig, new FakeProcces())
    let parameters: { skip: boolean; times: number }[] = [
      { skip: true, times: 0 },
      { skip: false, times: 1 },
    ]
    for (let el of parameters) {
      if (el.skip) {
        process.env.DANGER_SKIP_WHEN_EMPTY = "true"
      } else {
        process.env.DANGER_SKIP_WHEN_EMPTY = "false"
      }
      const dsl = await defaultDsl(platform)
      platform.deleteMainComment = jest.fn()
      await exec.handleResults(emptyResults, dsl.git)

      expect(process.env.DANGER_SKIP_WHEN_EMPTY).toBeDefined()
      expect(platform.deleteMainComment).toBeCalledTimes(el.times)
    }
  })

  it("Deletes a post when 'removePreviousComments' option has been specified", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(
      new FakeCI({}),
      platform,
      inlineRunner,
      { ...defaultConfig, removePreviousComments: true },
      new FakeProcces()
    )
    const dsl = await defaultDsl(platform)
    platform.deleteMainComment = jest.fn()

    await exec.handleResults(warnResults, dsl.git)
    expect(platform.deleteMainComment).toBeCalled()
  })

  it("Fails if the failOnErrors option is true and there are fails on the build", async () => {
    const platform = new FakePlatform()
    const strictConfig: ExecutorOptions = {
      stdoutOnly: false,
      verbose: false,
      jsonOnly: false,
      dangerID: "123",
      passURLForDSL: false,
      failOnErrors: true,
      ignoreOutOfDiffComments: false,
    }
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, strictConfig, new FakeProcces())
    const dsl = await defaultDsl(platform)
    platform.deleteMainComment = jest.fn()

    await exec.handleResults(failsResults, dsl.git)
    expect(exec.process.exitCode).toEqual(1)
  })

  it("Doesn't fail if the failOnErrors option is false and there are fails on the build", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig, new FakeProcces())
    const dsl = await defaultDsl(platform)
    platform.deleteMainComment = jest.fn()

    await exec.handleResults(failsResults, dsl.git)
    expect(exec.process.exitCode).toEqual(0)
  })

  it("Updates or Creates comments for warnings", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig, new FakeProcces())
    const dsl = await defaultDsl(platform)
    platform.updateOrCreateComment = jest.fn()

    await exec.handleResults(warnResults, dsl.git)
    expect(platform.updateOrCreateComment).toBeCalled()
  })

  it("Creates comments (rather than update or create) for warnings when newComment option is passed", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(
      new FakeCI({}),
      platform,
      inlineRunner,
      { ...defaultConfig, newComment: true },
      new FakeProcces()
    )
    const dsl = await defaultDsl(platform)
    platform.createComment = jest.fn()
    platform.updateOrCreateComment = jest.fn()

    await exec.handleResults(warnResults, dsl.git)
    expect(platform.createComment).toBeCalled()
    expect(platform.updateOrCreateComment).not.toBeCalled()
  })

  it("Updates or Creates comments for warnings, without GitDSL", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig, new FakeProcces())
    platform.updateOrCreateComment = jest.fn()

    await exec.handleResults(warnResults)
    expect(platform.updateOrCreateComment).toBeCalled()
  })

  it("Creates comments (rather than update or create) for warnings, without GitDSL, when newComment option is passed", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(
      new FakeCI({}),
      platform,
      inlineRunner,
      { ...defaultConfig, newComment: true },
      new FakeProcces()
    )
    platform.createComment = jest.fn()
    platform.updateOrCreateComment = jest.fn()

    await exec.handleResults(warnResults)
    expect(platform.createComment).toBeCalled()
    expect(platform.updateOrCreateComment).not.toBeCalled()
  })

  it("Sends inline comments and returns regular results for failures", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig, new FakeProcces())
    const dsl = await defaultDsl(platform)
    platform.createInlineComment = jest.fn().mockReturnValue(new Promise<any>((_, reject) => reject()))

    let results = await exec.sendInlineComments(singleViolationSingleFileResults, dsl.git, [])
    expect(results).toEqual(singleViolationSingleFileResults)
  })

  it("Creates an inline comment for warning", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig, new FakeProcces())
    const dsl = await defaultDsl(platform)
    platform.createInlineComment = jest.fn()
    platform.createComment = jest.fn()
    platform.updateOrCreateComment = jest.fn()

    await exec.handleResults(inlineWarnResults, dsl.git)
    expect(platform.createInlineComment).toBeCalled()
  })

  it("Creates multiple inline comments as a review", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig, new FakeProcces())
    const dsl = await defaultDsl(platform)
    platform.createInlineReview = jest.fn()
    platform.createInlineComment = jest.fn()
    platform.createComment = jest.fn()
    platform.updateOrCreateComment = jest.fn()

    await exec.handleResults(inlineMultipleWarnResults, dsl.git)
    expect(platform.createInlineReview).toBeCalled()
    expect(platform.createInlineComment).not.toBeCalled()
    expect(platform.updateOrCreateComment).not.toBeCalled()
  })

  it("Creates multiple inline comments if review fails", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig, new FakeProcces())
    const dsl = await defaultDsl(platform)
    platform.createInlineReview = jest.fn().mockImplementation(() => {
      throw new Error("Should not be called")
    })
    platform.createInlineComment = jest.fn()
    platform.createComment = jest.fn()
    platform.updateOrCreateComment = jest.fn()

    await exec.handleResults(inlineMultipleWarnResults, dsl.git)
    expect(platform.createInlineReview).toBeCalled()
    expect(platform.createInlineComment).not.toBeCalled()
    expect(platform.updateOrCreateComment).toBeCalled()
  })

  it("Invalid inline comment is ignored if ignoreOutOfDiffComments is true", async () => {
    const platform = new FakePlatform()
    const config = Object.assign({}, defaultConfig, { ignoreOutOfDiffComments: true })
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, config, new FakeProcces())
    const dsl = await defaultDsl(platform)
    platform.createInlineComment = jest.fn().mockReturnValue(new Promise<any>((_, reject) => reject()))
    platform.createComment = jest.fn()
    platform.updateOrCreateComment = jest.fn()

    await exec.handleResults(inlineWarnResults, dsl.git)
    expect(platform.createComment).not.toBeCalled()
    expect(platform.updateOrCreateComment).not.toBeCalled()
  })

  it("Updates an inline comment as the new one was different than the old", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig, new FakeProcces())
    const dsl = await defaultDsl(platform)
    const previousResults = inlineWarnResults
    const newResults = inlineFailResults
    const inlineResults = resultsIntoInlineResults(previousResults)[0]
    const comment = inlineTemplate(defaultConfig.dangerID, previousResults, inlineResults.file, inlineResults.line)
    const previousComments = [{ id: 1234, body: comment, ownedByDanger: true }]
    platform.getInlineComments = jest.fn().mockReturnValue(new Promise((r) => r(previousComments)))
    platform.updateInlineComment = jest.fn()
    platform.createInlineComment = jest.fn()

    await exec.handleResults(newResults, dsl.git)
    expect(platform.updateInlineComment).toBeCalled()
    expect(platform.createInlineComment).not.toBeCalled()
  })

  it("Updates multiple inline comments", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig, new FakeProcces())
    const dsl = await defaultDsl(platform)
    const previousResults = inlineMultipleWarnResults
    const newResults = inlineMultipleWarnResults2
    const previousComments = mockPayloadForResults(previousResults)
    platform.getInlineComments = jest.fn().mockReturnValue(new Promise((r) => r(previousComments)))
    platform.updateInlineComment = jest.fn()
    platform.createInlineComment = jest.fn()
    platform.deleteInlineComment = jest.fn()

    await exec.handleResults(newResults, dsl.git)
    expect(platform.updateInlineComment).toHaveBeenCalledTimes(3)
    expect(platform.createInlineComment).not.toBeCalled()
    expect(platform.deleteInlineComment).not.toBeCalled()
  })

  it("Doesn't update/create an inline comment as the old was the same as the new", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig, new FakeProcces())
    const dsl = await defaultDsl(platform)
    const previousResults = inlineWarnResults
    const newResults = previousResults
    const inlineResults = resultsIntoInlineResults(previousResults)[0]
    const comment = inlineTemplate(defaultConfig.dangerID, previousResults, inlineResults.file, inlineResults.line)
    const previousComments = [{ id: 1234, body: comment, ownedByDanger: true }]
    platform.getInlineComments = jest.fn().mockReturnValue(new Promise((r) => r(previousComments)))
    platform.updateInlineComment = jest.fn()
    platform.createInlineComment = jest.fn()

    await exec.handleResults(newResults, dsl.git)
    expect(platform.updateInlineComment).not.toBeCalled()
    expect(platform.createInlineComment).not.toBeCalled()
  })

  it("Creates new inline comment as none of the old ones was for this file/line", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig, new FakeProcces())
    const dsl = await defaultDsl(platform)
    const previousResults = inlineWarnResults
    const newResults = inlineMessageResults
    const inlineResults = resultsIntoInlineResults(previousResults)[0]
    const comment = inlineTemplate(defaultConfig.dangerID, previousResults, inlineResults.file, inlineResults.line)
    const previousComments = [{ id: 1234, body: comment, ownedByDanger: true }]
    platform.getInlineComments = jest.fn().mockReturnValue(new Promise((r) => r(previousComments)))
    platform.updateInlineComment = jest.fn()
    platform.createInlineComment = jest.fn()

    await exec.handleResults(newResults, dsl.git)
    expect(platform.updateInlineComment).not.toBeCalled()
    expect(platform.createInlineComment).toBeCalled()
  })

  it("Deletes all old inline comments because new results are all clear", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig, new FakeProcces())
    const dsl = await defaultDsl(platform)
    const previousResults = {
      fails: [],
      warnings: [
        { message: "1", file: "1.swift", line: 1 },
        { message: "2", file: "2.swift", line: 2 },
      ],
      messages: [],
      markdowns: [],
    }
    const previousComments = mockPayloadForResults(previousResults)
    const newResults = emptyResults

    platform.getInlineComments = jest.fn().mockReturnValue(new Promise((r) => r(previousComments)))
    platform.updateInlineComment = jest.fn()
    platform.createInlineComment = jest.fn()
    platform.deleteInlineComment = jest.fn()

    await exec.handleResults(newResults, dsl.git)
    expect(platform.updateInlineComment).not.toBeCalled()
    expect(platform.createInlineComment).not.toBeCalled()
    expect(platform.deleteInlineComment).toHaveBeenCalledTimes(2)
  })

  it("Deletes all old inline comments when 'removePreviousComments' option has been specified", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(
      new FakeCI({}),
      platform,
      inlineRunner,
      { ...defaultConfig, removePreviousComments: true },
      new FakeProcces()
    )
    const dsl = await defaultDsl(platform)
    const previousComments = mockPayloadForResults(inlineMultipleWarnResults)

    platform.getInlineComments = jest.fn().mockResolvedValueOnce(previousComments).mockResolvedValueOnce([])
    platform.updateInlineComment = jest.fn()
    platform.createInlineComment = jest.fn()
    platform.deleteInlineComment = jest.fn()

    await exec.handleResults(warnResults, dsl.git)
    expect(platform.deleteInlineComment).toHaveBeenCalledTimes(3)
  })

  it("Deletes old inline comment when not applicable in new results", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig, new FakeProcces())
    const dsl = await defaultDsl(platform)
    const previousResults = {
      fails: [],
      warnings: [
        { message: "1", file: "1.swift", line: 1 },
        { message: "2", file: "2.swift", line: 2 },
      ],
      messages: [],
      markdowns: [],
    }
    const newResults = {
      fails: [],
      warnings: [
        { message: "1", file: "1.swift", line: 2 },
        { message: "2", file: "2.swift", line: 3 },
      ],
      messages: [],
      markdowns: [],
    }
    const previousComments = mockPayloadForResults(previousResults)

    platform.getInlineComments = jest.fn().mockReturnValue(new Promise((r) => r(previousComments)))
    platform.updateInlineComment = jest.fn()
    platform.createInlineComment = jest.fn()
    platform.deleteInlineComment = jest.fn()

    await exec.handleResults(newResults, dsl.git)
    expect(platform.updateInlineComment).not.toBeCalled()
    expect(platform.createInlineComment).toHaveBeenCalledTimes(2)
    expect(platform.deleteInlineComment).toHaveBeenCalledTimes(2)
  })

  it("Updates the status with success for a passed empty results", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig, new FakeProcces())
    const dsl = await defaultDsl(platform)
    platform.createComment = jest.fn()
    platform.updateOrCreateComment = jest.fn()
    platform.updateStatus = jest.fn()

    await exec.handleResults(emptyResults, dsl.git)
    expect(platform.updateStatus).toBeCalledWith(true, expect.any(String), undefined, defaultConfig.dangerID)
  })

  it("Updates the status with success for a passed results", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig, new FakeProcces())
    const dsl = await defaultDsl(platform)
    platform.createComment = jest.fn()
    platform.updateOrCreateComment = jest.fn()
    platform.updateStatus = jest.fn()

    await exec.handleResults(warnResults, dsl.git)
    expect(platform.updateStatus).toBeCalledWith(
      true,
      "Found some issues. Don't worry, everything is fixable.",
      undefined,
      defaultConfig.dangerID
    )
  })

  it("Updates the status with success for failing results", async () => {
    const platform = new FakePlatform()
    const exec = new Executor(new FakeCI({}), platform, inlineRunner, defaultConfig, new FakeProcces())
    const dsl = await defaultDsl(platform)
    platform.createComment = jest.fn()
    platform.updateOrCreateComment = jest.fn()
    platform.updateStatus = jest.fn()

    await exec.handleResults(failsResults, dsl.git)
    expect(platform.updateStatus).toBeCalledWith(
      false,
      "Found some issues. Don't worry, everything is fixable.",
      undefined,
      defaultConfig.dangerID
    )
  })

  it("Passes the URL from a platform to the updateStatus", async () => {
    const platform = new FakePlatform()
    const ci: any = new FakeCI({})
    ci.ciRunURL = "https://url.com"

    const exec = new Executor(ci, platform, inlineRunner, defaultConfig, new FakeProcces())
    const dsl = await defaultDsl(platform)
    platform.createComment = jest.fn()
    platform.updateOrCreateComment = jest.fn()
    platform.updateStatus = jest.fn()

    await exec.handleResults(failsResults, dsl.git)
    expect(platform.updateStatus).toBeCalledWith(expect.anything(), expect.anything(), ci.ciRunURL, expect.anything())
  })

  it("Doesn't update status when check publishing feature is disabled", async () => {
    const platform = new FakePlatform()
    const ci: any = new FakeCI({})
    ci.ciRunURL = "https://url.com"

    const config = {
      ...defaultConfig,
      noPublishCheck: true,
    }

    const exec = new Executor(ci, platform, inlineRunner, config, new FakeProcces())
    const dsl = await defaultDsl(platform)
    platform.createComment = jest.fn()
    platform.updateOrCreateComment = jest.fn()
    platform.updateStatus = jest.fn()

    await exec.handleResults(failsResults, dsl.git)
    expect(platform.updateStatus).not.toBeCalled()
  })
})
