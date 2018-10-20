jest.mock("../../platforms/git/localGetDiff", () => ({ localGetDiff: jest.fn(() => Promise.resolve({})) }))

/**
 * Mock everything that calls externally
 */
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
    expect(localGetDiff).toHaveBeenLastCalledWith("develop", "HEAD")
  })
})
