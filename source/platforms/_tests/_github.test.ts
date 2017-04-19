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

    async getPullRequestCommits() {
      const fixtures = await requestWithFixturedJSON("github_commits.json")
      return await fixtures()
    }

    async getReviews() {
      const fixtures = await requestWithFixturedJSON("reviews.json")
      return await fixtures()
    }

    async getReviewerRequests() {
      const fixtures = await requestWithFixturedJSON("requested_reviewers.json")
      return await fixtures()
    }

    getExternalAPI() {
      return {}
    }
  }

  return { GitHubAPI }
})

import { GitHub } from "../GitHub"
import { GitHubAPI } from "../github/GitHubAPI"

import { GitCommit } from "../../dsl/Commit"
import { FakeCI } from "../../ci_source/providers/Fake"
import * as os from "os"
import { RepoMetaData } from "../../ci_source/ci_source"

const EOL = os.EOL

describe("getPlatformDSLRepresentation", () => {
  let github: GitHub

  beforeEach(() => {
    github = new GitHub(new GitHubAPI({} as RepoMetaData))
  })

  it("should return the correct review title from getReviewInfo", async () => {
    const info = await github.getReviewInfo()
    expect(info.title).toEqual("Adds support for showing the metadata and trending Artists to a Gene VC")
  })

  it("should get the issue label", async() => {
    const issue = await github.getIssue()
    expect(issue.labels[0].name).toEqual("bug")
  })

  it("should get the commits of the pull request", async() => {
    const expected = "https://api.github.com/repos/artsy/emission/git/commits/13da2c844def1f4262ee440bd86fb2a3b021718b"
    const { commits } = await github.getPlatformDSLRepresentation()
    expect(commits[0].commit.url).toEqual(expected)
  })

  it("should get the reviews", async() => {
    const { reviews } = await github.getPlatformDSLRepresentation()
    expect(reviews[0].id).toEqual(2332973)
  })

  it("should get the reviewer requests", async () => {
    const { requested_reviewers } = await github.getPlatformDSLRepresentation()
    expect(requested_reviewers[0].id).toEqual(12397828)
  })

  it("should get the pull request informations", async () => {
    const { pr } = await github.getPlatformDSLRepresentation()
    expect(pr.number).toEqual(327)
  })
})
