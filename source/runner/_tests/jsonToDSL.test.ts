import { jsonToDSL } from "../jsonToDSL"
import { DangerDSLJSONType } from "../../dsl/DangerDSL"
import { GitDSL } from "../../dsl/GitDSL"

/**
 * Mock everything that calls externaly
 */
jest.mock("../../platforms/github/GitHubGit")
jest.mock("../../platforms/GitHub")
jest.mock("../../platforms/git/localGetDiff")
jest.mock("../../platforms/git/localGetCommits")
jest.mock("../../platforms/git/diffToGitJSONDSL")
jest.mock("../../platforms/git/gitJSONToGitDSL")
jest.mock("@octokit/rest")

// tslint:disable-next-line
const foo = require("../../platforms/git/localGetDiff")
foo.localGetDiff = jest.fn(() => Promise.resolve({}))

describe("runner/jsonToDSL", () => {
  let dsl
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
    const outputDsl = await jsonToDSL(dsl as DangerDSLJSONType)
    expect(outputDsl.github).toBeUndefined()
  })

  it("should call LocalGit with correct base", async () => {
    const outputDsl = await jsonToDSL(dsl as DangerDSLJSONType)
    expect(foo.localGetDiff).toHaveBeenLastCalledWith("develop", "HEAD")
  })
})
