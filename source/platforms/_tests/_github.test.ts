import { resolve } from "path"
import { readFileSync } from "fs"

const fixtures = resolve(__dirname, "fixtures")

/** Returns JSON from the fixtured dir */
export const requestWithFixturedJSON = async (path: string): Promise<() => Promise<any>> => () =>
  Promise.resolve(JSON.parse(readFileSync(`${fixtures}/${path}`, {}).toString()))

class mockGitHubAPI /*tslint:disable-line*/ {
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

  async getPullRequestInlineComments() {
    const fixtures = await requestWithFixturedJSON("github_inline_comments.json")
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

  APIMetadataForPR() {
    return {}
  }
}

// Mock GitHubAPI class
jest.mock("../github/GitHubAPI", () => {
  return { GitHubAPI: mockGitHubAPI }
})

import { GitHub, GitHubType } from "../GitHub"
import { GitHubAPI } from "../github/GitHubAPI"

import { RepoMetaData } from "../../dsl/BitBucketServerDSL"

describe("getPlatformDSLRepresentation", () => {
  let github: GitHubType

  beforeEach(() => {
    github = GitHub(new GitHubAPI({} as RepoMetaData))
  })

  it("should return the correct review title from getReviewInfo", async () => {
    const info = await github.getReviewInfo()
    expect(info.title).toEqual("Adds support for showing the metadata and trending Artists to a Gene VC")
  })

  it("should get the commits of the pull request", async () => {
    const expected = "https://api.github.com/repos/artsy/emission/git/commits/13da2c844def1f4262ee440bd86fb2a3b021718b"
    const { commits } = await github.getPlatformDSLRepresentation()
    expect(commits[0].commit.url).toEqual(expected)
  })

  it("should get the reviews", async () => {
    const { reviews } = await github.getPlatformDSLRepresentation()
    expect(reviews[0].id).toEqual(2332973)
  })

  it("should get the reviewer requests", async () => {
    const { requested_reviewers } = await github.getPlatformDSLRepresentation()
    expect(requested_reviewers[0].id).toEqual(12397828)
  })

  it("should get the pull request information", async () => {
    const { pr } = await github.getPlatformDSLRepresentation()
    expect(pr.number).toEqual(327)
  })

  it("should get the inline comments for this PR", async () => {
    const comments = await github.getInlineComments("danger-id")
    expect(comments[0].id).toEqual(81345954)
    expect(comments[0].body).toEqual("needed to update the schema for description\n")
    expect(comments.length).toEqual(6)
  })

  it("should set thisPR correct", async () => {
    const dsl = await github.getPlatformDSLRepresentation()

    expect(dsl.thisPR).toEqual({
      number: 327,
      owner: "artsy",
      repo: "emission",
    })
  })
})
