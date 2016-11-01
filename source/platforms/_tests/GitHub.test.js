// @flow

import { GitHub } from "../GitHub"
import Fake from "../../ci_source/Fake"

/** Gets a mocked out GitHub class for checking a get path */
const mockGitHubWithGetForPath = (expectedPath): GitHub => {
  const mockSource = new Fake({})
  const github = new GitHub("Token", mockSource)

  github.get = (path: string, headers: any = {}, body: any = {}, method: string = "GET"): Promise<any> => {
    return new Promise((resolve: any, reject: any) => {
      expect(path).toBe(expectedPath)
      resolve({})
    })
  }

  return github
}

describe("API results", () => {
  it("sets the correct paths for pull request comments", () => {
    const expectedPath = "repos/artsy/emission/issues/327/comments"
    const github = mockGitHubWithGetForPath(expectedPath)
    expect(github.getPullRequestComments())
  })

  it("sets the correct paths for getPullRequestDiff", () => {
    const expectedPath = "repos/artsy/emission/issues/327/comments"
    const github = mockGitHubWithGetForPath(expectedPath)
    expect(github.getPullRequestDiff())
  })

})
