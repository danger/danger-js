import { pullRequestParser } from "../pullRequestParser"

describe("parsing urls", () => {
  it("handles bad data", () => {
    expect(pullRequestParser("kjsdbfdsjkbfks")).toBeFalsy()
  })

  it("pulls out the repo / pr ID", () => {
    expect(pullRequestParser("https://github.com/facebook/jest/pull/2555")).toEqual({
      pullRequestNumber: "2555",
      repo: "facebook/jest",
    })
  })

  it("handles query params too", () => {
    const longPR = "https://github.com/artsy/emission/pull/406#pullrequestreview-10994863"
    expect(pullRequestParser(longPR)).toEqual({
      pullRequestNumber: "406",
      repo: "artsy/emission",
    })
  })

  it("handles bitbucket server PRs", () => {
    expect(pullRequestParser("http://localhost:7990/projects/PROJ/repos/repo/pull-requests/1")).toEqual({
      pullRequestNumber: "1",
      repo: "projects/PROJ/repos/repo",
    })
  })

  it("handles bitbucket server PRs (overview)", () => {
    expect(pullRequestParser("http://localhost:7990/projects/PROJ/repos/repo/pull-requests/1/overview")).toEqual({
      pullRequestNumber: "1",
      repo: "projects/PROJ/repos/repo",
    })
  })
})
