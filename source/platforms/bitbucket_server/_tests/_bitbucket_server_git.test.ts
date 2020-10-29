import { BitBucketServer } from "../../BitBucketServer"
import { BitBucketServerAPI } from "../BitBucketServerAPI"

import { FakeCI } from "../../../ci_source/providers/Fake"
import { readFileSync, writeFileSync } from "fs"
import { resolve, join as pathJoin } from "path"
import { bitBucketServerGitDSL as gitJSONToGitDSL } from "../BitBucketServerGit"

import { BitBucketServerJSONDSL } from "../../../dsl/BitBucketServerDSL"
import { GitDSL, GitJSONDSL } from "../../../dsl/GitDSL"
import { jsonDSLGenerator } from "../../../runner/dslGenerator"

const fixtures = resolve(__dirname, "..", "..", "_tests", "fixtures")

/** Returns a fixture. */
const loadFixture = (path: string): string =>
  readFileSync(pathJoin(fixtures, path), {})
    .toString()
    .replace(/\r/g, "")

/** Returns JSON from the fixtured dir */
export const requestWithFixturedJSON = async (path: string): Promise<() => Promise<any>> => () =>
  Promise.resolve(JSON.parse(loadFixture(path)))

/** Returns arbitrary text value from a request */
export const requestWithFixturedContent = async (path: string): Promise<() => Promise<string>> => () =>
  Promise.resolve(loadFixture(path))

/**
 * HACKish: Jest on Windows seems to include some additional
 * whitespace that differs from non-Windows snapshot output,
 * so we strip these until we can better-address the issue.
 */
const stripWhitespaceForSnapshot = (str: string) => {
  return str.replace(/\s/g, "")
}

const pullRequestInfoFilename = "bitbucket_server_pr.json"

describe("the dangerfile gitDSL - BitBucket Server", () => {
  let bbs: BitBucketServer = {} as any
  let gitJSONDSL: GitJSONDSL = {} as any

  let bbsDSL: BitBucketServerJSONDSL = {} as any
  let gitDSL: GitDSL = {} as any

  beforeEach(async () => {
    const api = new BitBucketServerAPI(new FakeCI({}), { host: "fake://host" })
    bbs = new BitBucketServer(api)

    api.getIssues = await requestWithFixturedJSON("bitbucket_server_issues.json")
    api.getPullRequestChanges = await requestWithFixturedJSON("bitbucket_server_changes.json")
    api.getStructuredDiffForFile = await requestWithFixturedJSON("bitbucket_server_diff.json")
    api.getPullRequestInfo = await requestWithFixturedJSON(pullRequestInfoFilename)
    api.getPullRequestCommits = await requestWithFixturedJSON("bitbucket_server_commits.json")
    api.getPullRequestComments = await requestWithFixturedJSON("bitbucket_server_comments.json")
    api.getPullRequestActivities = await requestWithFixturedJSON("bitbucket_server_activities.json")
    api.getFileContents = async (path, repoSlug, ref) => JSON.stringify({ path, repoSlug, ref })

    gitJSONDSL = await bbs.getPlatformGitRepresentation()
    bbsDSL = await bbs.getPlatformReviewDSLRepresentation()
    gitDSL = gitJSONToGitDSL(bbsDSL, gitJSONDSL, bbs.api)
  })

  it("sets the modified/created/deleted", async () => {
    expect(gitJSONDSL.modified_files).toEqual([".gitignore"])
    expect(gitJSONDSL.created_files).toEqual(["banana", "orange", ".babelrc"])
    expect(gitJSONDSL.deleted_files).toEqual([".babelrc.example", "jest.eslint.config.js"])
  })

  it("shows the diff for a specific file", async () => {
    const { diff } = (await gitDSL.diffForFile(".gitignore"))!

    expect(stripWhitespaceForSnapshot(diff)).toMatchSnapshot()
  })

  it("should include `before` text content of the file", async () => {
    const { before } = (await gitDSL.diffForFile(".gitignore"))!

    expect(stripWhitespaceForSnapshot(before)).toMatchSnapshot()
  })

  it("should include `after` text content of the file", async () => {
    const { after } = (await gitDSL.diffForFile(".gitignore"))!

    expect(stripWhitespaceForSnapshot(after)).toMatchSnapshot()
  })

  it("should include `added` text content of the file", async () => {
    const { added } = (await gitDSL.diffForFile(".gitignore"))!

    expect(stripWhitespaceForSnapshot(added)).toMatchSnapshot()
  })

  it("should not include `removed` text content of the file", async () => {
    const { removed } = (await gitDSL.diffForFile(".gitignore"))!
    expect(stripWhitespaceForSnapshot(removed)).toMatchSnapshot()
  })

  it("resolves to `null` for files not in modified_files", async () => {
    const result = (await gitDSL.diffForFile("fuhqmahgads.json"))!

    expect(result).toBeNull()
  })

  it("sets up commit data correctly", async () => {
    expect(gitDSL.commits[0]).toMatchSnapshot()
  })

  it("shows the structured diff for a specific file", async () => {
    const { chunks } = (await gitDSL.structuredDiffForFile(".gitignore"))!
    expect(chunks).toMatchSnapshot()
  })

  it("should have `normal` type of line for inline comment for modified file", async () => {
    const type = await bbs.findTypeOfLine(gitDSL, 3, ".gitignore")
    expect(type).toBe("normal")
  })

  it("should have `add` type of line for inline comment for modified file", async () => {
    const type = await bbs.findTypeOfLine(gitDSL, 10, ".gitignore")
    expect(type).toBe("add")
  })

  it("should have `add` type of line for inline comment for added file", async () => {
    const type = await bbs.findTypeOfLine(gitDSL, 1, "banana")
    expect(type).toBe("add")
  })

  it("checks promise rejection for line not in the diff for inline comment", async () => {
    const promise = bbs.findTypeOfLine(gitDSL, 2, "banana")
    await expect(promise).rejects.toBeUndefined()
  })

  it("checks promise rejection for `del` line for inline comment for deleted file", async () => {
    const promise = bbs.findTypeOfLine(gitDSL, 0, "jest.eslint.config.js")
    await expect(promise).rejects.toBeUndefined()
  })

  it("writes a JSON DSL fixture", async () => {
    const fakeSource = new FakeCI({})
    const dataSent = await jsonDSLGenerator(bbs, fakeSource, {} as any)
    dataSent.settings.github.accessToken = "12345"

    writeFileSync(pathJoin(fixtures, "bbs-dsl-input.json"), JSON.stringify(dataSent, null, "  "), "utf8")
  })
})
