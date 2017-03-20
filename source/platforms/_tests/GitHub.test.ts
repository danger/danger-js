import { GitHub } from "../GitHub"
import { GitHubAPI } from "../github/GitHubAPI"

import { GitCommit } from "../../dsl/Commit"
import { FakeCI } from "../../ci_source/providers/Fake"
import { readFileSync } from "fs"
import { resolve } from "path"
import * as os from "os"

const fixtures = resolve(__dirname, "fixtures")
const EOL = os.EOL

/** Returns JSON from the fixtured dir */
export const requestWithFixturedJSON = async (path: string): Promise<() => Promise<any>> => () => (
  Promise.resolve(JSON.parse(readFileSync(`${fixtures}/${path}`, {}).toString()))
)

describe("with fixtured data", () => {
  it("returns the correct github data", async () => {
    const mockSource = new FakeCI({})
    const api = new GitHubAPI(mockSource)
    const github = new GitHub(api)
    api.getPullRequestInfo = await requestWithFixturedJSON("github_pr.json")

    const info = await github.getReviewInfo()
    expect(info.title).toEqual("Adds support for showing the metadata and trending Artists to a Gene VC")
  })
})

describe("getPlatformDSLRepresentation", () => {
  // need to cover:
  // - getReviewInfo
  // - getIssue
  // - getPullRequestCommits
  // - getReviews
  // - getReviewerRequests
  // to do a full DSL test
})
