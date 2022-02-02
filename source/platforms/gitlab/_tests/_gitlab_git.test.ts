/* eslint-disable jest/no-export */
import { readFileSync } from "fs"
import { join as pathJoin } from "path"
import _ from "lodash"

import { GitLabDSL } from "../../../dsl/GitLabDSL"
import { GitDSL, GitJSONDSL } from "../../../dsl/GitDSL"

import GitLab, { gitlabJSONToGitLabDSL } from "../../GitLab"
import GitLabAPI, { getGitLabAPICredentialsFromEnv } from "../GitLabAPI"
import { gitLabGitDSL as gitJSONToGitDSL, gitlabChangesToDiff } from "../GitLabGit"

const fixtures = pathJoin(__dirname, "fixtures")

/** Returns a fixture. */
const loadFixture = (path: string): string =>
  readFileSync(pathJoin(fixtures, path), {})
    .toString()
    .replace(/\r/g, "")

/** Returns JSON from the fixtured dir */
export const requestWithFixturedJSON = (path: string, field = ""): (() => Promise<any>) => () => {
  let data = JSON.parse(loadFixture(path))
  if (field) {
    data = _.get(data, field)
  }

  return Promise.resolve(data)
}

/** Returns arbitrary text value from a request */
export const requestWithFixturedContent = (path: string): (() => Promise<string>) => () =>
  Promise.resolve(loadFixture(path))

/**
 * HACKish: Jest on Windows seems to include some additional
 * whitespace that differs from non-Windows snapshot output,
 * so we strip these until we can better-address the issue.
 */
const stripWhitespaceForSnapshot = (str: string) => {
  return str.replace(/\s/g, "")
}

const MRInfoFixture = "getMergeRequestInfo.json"
const changedFilePath = "danger/roulette/Dangerfile"
const baseSHA = JSON.parse(readFileSync(pathJoin(fixtures, MRInfoFixture), {}).toString())[0].response.diff_refs
  .base_sha

describe("GitLabGit DSL", () => {
  let gitlab: GitLab = {} as any
  let gitJSONDSL: GitJSONDSL = {} as any

  let gitlabDSL: GitLabDSL = {} as any
  let gitDSL: GitDSL = {} as any

  beforeEach(async () => {
    const api = new GitLabAPI(
      { pullRequestID: "27117", repoSlug: "gitlab-org/gitlab-foss" },
      getGitLabAPICredentialsFromEnv({
        DANGER_GITLAB_HOST: "gitlab.com",
        DANGER_GITLAB_API_TOKEN: "FAKE_DANGER_GITLAB_API_TOKEN",
      })
    )
    gitlab = new GitLab(api)

    // Actually used
    const defaultField = "0.response"

    api.getMergeRequestInfo = requestWithFixturedJSON(MRInfoFixture, defaultField)
    api.getMergeRequestApprovals = requestWithFixturedJSON("getMergeRequestApprovals.json", defaultField)
    api.getMergeRequestCommits = requestWithFixturedJSON("getMergeRequestCommits.json", defaultField)
    api.getMergeRequestChanges = requestWithFixturedJSON("getMergeRequestChanges.json", `${defaultField}.changes`)
    api.getCompareChanges = requestWithFixturedJSON("getCompareChanges.json", `${defaultField}.diffs`)

    gitJSONDSL = await gitlab.getPlatformGitRepresentation()
    const gitlabJSONDSL = await gitlab.getPlatformReviewDSLRepresentation()
    gitlabDSL = gitlabJSONToGitLabDSL(gitlabJSONDSL as GitLabDSL, api)

    const before = await requestWithFixturedContent("fileContentsBefore.txt")()
    const after = await requestWithFixturedContent("fileContentsAfter.txt")()
    gitlabDSL.utils.fileContents = async (_path, _repo, ref) => {
      if (_path !== changedFilePath) {
        return ""
      }
      return ref === baseSHA ? before : after
    }

    gitDSL = gitJSONToGitDSL(gitlabDSL, gitJSONDSL, gitlab.api)
  })

  it("show diff chunks for a specific file", async () => {
    const { chunks } = (await gitDSL.structuredDiffForFile(changedFilePath))!

    expect(chunks).toMatchSnapshot()
  })

  it("shows the diff for a specific file", async () => {
    const { diff } = (await gitDSL.diffForFile(changedFilePath))!

    expect(stripWhitespaceForSnapshot(diff)).toMatchSnapshot()
  })

  describe("textDiffForFile", () => {
    it("returns a null for files not in the change list", async () => {
      const empty = await gitDSL.diffForFile("fuhqmahgads.json")
      expect(empty).toEqual(null)
    })

    it("returns a diff for modified files", async () => {
      gitDSL = gitJSONToGitDSL(gitlabDSL, gitJSONDSL, gitlab.api)
      const diff = (await gitDSL.diffForFile(changedFilePath))!

      expect(diff).toMatchSnapshot()
    })
  })

  describe("gitlabChangesToDiff", () => {
    it("should convert changes to diff", async () => {
      const { diffs: changes } = await requestWithFixturedJSON("gitlab_changes.json")()

      const diff = gitlabChangesToDiff(changes)

      expect(diff).toMatchSnapshot()
    })
  })
})
