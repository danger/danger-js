jest.mock("../../../api/fetch")
import { api } from "../../../api/fetch"
const apiGH = api as jest.Mock

jest.mock("../../../runner/runners/utils/transpiler")
import transpiler from "../../../runner/runners/utils/transpiler"
const mockTranspiler = transpiler as jest.Mock

import {
  customGitHubResolveRequest,
  dangerPrefix,
  shouldUseGitHubOverride,
  dangerRepresentationForPath,
} from "../customGitHubRequire"

describe("shouldUseGitHubOverride", () => {
  it("ignores module imports", () => {
    const module = "peril"
    const parent: any = { filename: "index.js" }
    expect(shouldUseGitHubOverride(module, parent)).toBeFalsy()
  })

  it("ignores relative imports in other modules", () => {
    const module = "./peril"
    const parent: any = { filename: "node_modules/danger/index.js" }
    expect(shouldUseGitHubOverride(module, parent)).toBeFalsy()
  })

  it("accepts relative imports in modules with a parent that has the right prefix", () => {
    const module = "./peril"
    const parent: any = { filename: dangerPrefix + "./my-import" }
    expect(shouldUseGitHubOverride(module, parent)).toBeTruthy()
  })
})

describe("customGitHubResolveRequest", () => {
  it("makes the right GH request for the relative file", async () => {
    const module = "./myapp/peril-resolver"
    const parent: any = { filename: dangerPrefix + "orta/peril-settings/my-import" }
    const token = "1231231231"
    const resolver = customGitHubResolveRequest(token)

    // the transpiler handles the actual content
    apiGH.mockResolvedValue({ ok: true, json: () => Promise.resolve({ content: "hi" }) })
    mockTranspiler.mockReturnValueOnce("module.exports = { hello: 'world' }")

    const result = await resolver(module, parent)

    // It should make the right API call to
    expect(apiGH).toBeCalledWith(
      "https://api.github.com/repos/orta/peril-settings/contents//myapp/peril-resolver.js?ref=master",
      {
        headers: { Authorization: "bearer 1231231231" },
      }
    )

    // It should return the transpiled module
    expect(result).toEqual({ hello: "world" })
  })
})

describe("dangerRepresentationforPath", () => {
  it("returns just the path with master and no repo with just a path", () => {
    const path = "dangerfile.ts"
    expect(dangerRepresentationForPath(path)).toEqual({
      branch: "master",
      dangerfilePath: "dangerfile.ts",
      referenceString: "dangerfile.ts",
      repoSlug: undefined,
    })
  })

  it("returns the path and repo", () => {
    const path = "orta/eigen/dangerfile.ts"
    expect(dangerRepresentationForPath(path)).toEqual({
      branch: "master",
      dangerfilePath: "dangerfile.ts",
      referenceString: "orta/eigen/dangerfile.ts",
      repoSlug: "orta/eigen",
    })
  })

  it("returns just the path when there is no repo reference", () => {
    const path = "orta/eigen/dangerfile.ts@branch"
    expect(dangerRepresentationForPath(path)).toEqual({
      branch: "branch",
      dangerfilePath: "dangerfile.ts",
      referenceString: "orta/eigen/dangerfile.ts@branch",
      repoSlug: "orta/eigen",
    })
  })

  it("handles a branch with no repo ref", () => {
    const path = "dangerfile.ts@branch"
    expect(dangerRepresentationForPath(path)).toEqual({
      branch: "branch",
      dangerfilePath: "dangerfile.ts",
      referenceString: "dangerfile.ts@branch",
      repoSlug: undefined,
    })
  })
})
