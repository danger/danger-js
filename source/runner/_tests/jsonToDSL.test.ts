jest.mock("../../platforms/git/localGetDiff", () => ({ localGetDiff: jest.fn(() => Promise.resolve({})) }))

/**
 * Mock everything that calls externally
 */
jest.mock("../../platforms/bitbucket_server/BitBucketServerGit")
jest.mock("../../platforms/github/GitHubGit")
jest.mock("../../platforms/GitHub")
jest.mock("../../platforms/git/localGetDiff")
jest.mock("../../platforms/git/localGetCommits")
jest.mock("../../platforms/git/diffToGitJSONDSL")
jest.mock("../../platforms/git/gitJSONToGitDSL")
jest.mock("@octokit/rest")

import { localGetDiff } from "../../platforms/git/localGetDiff"

import { jsonToDSL } from "../jsonToDSL"
import { DangerDSLJSONType } from "../../dsl/DangerDSL"
import { FakeCI } from "../../ci_source/providers/Fake"

describe("runner/jsonToDSL", () => {
  let dsl: any
  beforeEach(() => {
    dsl = {
      settings: {
        github: {},
        cliArgs: {
          base: "develop",
        },
      },
    }
  })

  it("should have a function named jsonToDSL", () => {
    expect(jsonToDSL).toBeTruthy()
  })

  it("should return config", async () => {
    const outputDsl = await jsonToDSL(dsl as DangerDSLJSONType, new FakeCI({}))
    expect(outputDsl.github).toBeUndefined()
  })

  it("should call LocalGit with correct base", async () => {
    await jsonToDSL(dsl as DangerDSLJSONType, new FakeCI({}))
    expect(localGetDiff).toHaveBeenLastCalledWith("develop", "HEAD", undefined)
    dsl.settings.cliArgs.staged = true
    await jsonToDSL(dsl as DangerDSLJSONType, new FakeCI({}))
    expect(localGetDiff).toHaveBeenLastCalledWith("develop", "HEAD", true)
  })

  it("should expose BitBucketServerAPI if `dsl.bitbucket_server` is passed in", async () => {
    const originalHost = process.env["DANGER_BITBUCKETSERVER_HOST"]
    try {
      process.env["DANGER_BITBUCKETSERVER_HOST"] = "https://bitbucket.mycompany.com"
      const outputDsl = await jsonToDSL({ ...dsl, bitbucket_server: {} } as DangerDSLJSONType, new FakeCI({}))
      // Simply enumerate a few APIs `BitBucketServerAPI` provides
      expect(outputDsl.bitbucket_server.api).toMatchObject({
        get: expect.any(Function),
        post: expect.any(Function),
        put: expect.any(Function),
        delete: expect.any(Function),
        getPullRequestInfo: expect.any(Function),
      })
    } finally {
      process.env["DANGER_BITBUCKETSERVER_HOST"] = originalHost
    }
  })
})
