import { resolve } from "path"
import { readFileSync } from "fs"

const fixtures = resolve(__dirname, "fixtures")

/** Returns JSON from the fixtured dir */
export const requestWithFixturedJSON = async (path: string): Promise<() => Promise<any>> => () =>
  Promise.resolve(JSON.parse(readFileSync(`${fixtures}/${path}`, {}).toString()))

class mockBitBucketServerAPI /*tslint:disable-line*/ {
  async getPullRequestInfo() {
    const fixtures = await requestWithFixturedJSON("bitbucket_server_pr.json")
    return await fixtures()
  }
  async getIssues() {
    const fixtures = await requestWithFixturedJSON("bitbucket_server_issues.json")
    return await fixtures()
  }
  async getPullRequestCommits() {
    const fixtures = await requestWithFixturedJSON("bitbucket_server_commits.json")
    return await fixtures()
  }
  async getPullRequestComments() {
    const fixtures = await requestWithFixturedJSON("bitbucket_server_comments.json")
    return await fixtures()
  }
  async getPullRequestDiff() {
    const fixtures = await requestWithFixturedJSON("bitbucket_server_diff.json")
    return await fixtures()
  }
  async getPullRequestActivities() {
    const fixtures = await requestWithFixturedJSON("bitbucket_server_activities.json")
    return await fixtures()
  }
}

// Mock API class
jest.mock("../bitbucket_server/BitBucketServerAPI", () => {
  return { BitBucketServerAPI: mockBitBucketServerAPI }
})

import { BitBucketServer } from "../BitBucketServer"
import { BitBucketServerAPI } from "../bitbucket_server/BitBucketServerAPI"

import { RepoMetaData } from "../../dsl/BitBucketServerDSL"

describe("getPlatformDSLRepresentation", () => {
  let bbs: BitBucketServer

  beforeEach(() => {
    bbs = new BitBucketServer(new BitBucketServerAPI({} as RepoMetaData, { host: "fake://host" }))
  })

  it("should return the correct review title from getReviewInfo", async () => {
    const info = await bbs.getReviewInfo()
    expect(info.title).toEqual("Pull request title")
  })

  it("should get the commits of the pull request", async () => {
    const { commits } = await bbs.getPlatformDSLRepresentation()
    expect(commits).toMatchSnapshot()
  })

  it("should get the activities", async () => {
    const { activities } = await bbs.getPlatformDSLRepresentation()
    expect(activities).toMatchSnapshot()
  })

  it("should get the reviewer comments", async () => {
    const { comments } = await bbs.getPlatformDSLRepresentation()
    expect(comments).toMatchSnapshot()
  })

  it("should get the pull request information", async () => {
    const { pr } = await bbs.getPlatformDSLRepresentation()
    expect(pr).toMatchSnapshot()
  })

  it("should get the metadata", async () => {
    const dsl = await bbs.getPlatformDSLRepresentation()
    expect(dsl.metadata).toMatchSnapshot()
  })
})
