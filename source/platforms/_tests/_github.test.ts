import { resolve } from "path"
import { readFileSync } from "fs"

const fixtures = resolve(__dirname, "fixtures")

/** Returns JSON from the fixtured dir */
export const requestWithFixturedJSON = async (path: string): Promise<() => Promise<any>> => () => (
  Promise.resolve(JSON.parse(readFileSync(`${fixtures}/${path}`, {}).toString()))
)

// Mock GitHubAPI class
jest.mock("../github/GitHubAPI", () => {
  class GitHubAPI {
    async getPullRequestInfo() {
      const fixtures = await requestWithFixturedJSON("github_pr.json")
      return await fixtures()
    }
    async getIssue() {
      const fixtures = await requestWithFixturedJSON("github_issue.json")
      return await fixtures()
    }
  }

  return { GitHubAPI }
})

import { GitHub } from "../GitHub"
import { GitHubAPI } from "../github/GitHubAPI"

import { GitCommit } from "../../dsl/Commit"
import { FakeCI } from "../../ci_source/providers/Fake"
import * as os from "os"

const EOL = os.EOL

describe("getPlatformDSLRepresentation", () => {
  let github

  beforeEach(() => {
    github = new GitHub(new GitHubAPI({} as any))
  })

  it("should return the correct review title from getReviewInfo", async () => {
    const info = await github.getReviewInfo()
    expect(info.title).toEqual("Adds support for showing the metadata and trending Artists to a Gene VC")
  })

  it("should get the issue label", async() => {
    const issue = await github.getIssue()
    expect(issue.labels[0].name).toEqual("bug")
  })

  // need to cover:
  // - getPullRequestCommits
  // - getReviews
  // - getReviewerRequests
  // to do a full DSL test
})
