/* eslint-disable jest/no-export */
import { bitBucketCloudRawAndDateToGitCommitAuthor } from "../BitBucketCloudGit"

import { BitBucketCloud } from "../../BitBucketCloud"
import { BitBucketCloudAPI } from "../BitBucketCloudAPI"
import { FakeCI } from "../../../ci_source/providers/Fake"
import { readFileSync, writeFileSync } from "fs"
import { resolve, join as pathJoin } from "path"
import { bitBucketCloudGitDSL as gitJSONToGitDSL } from "../BitBucketCloudGit"

import { BitBucketCloudJSONDSL } from "../../../dsl/BitBucketCloudDSL"
import { GitJSONDSL, GitDSL } from "../../../dsl/GitDSL"
import { GitCommit } from "../../../dsl/Commit"
import { jsonDSLGenerator } from "../../../runner/dslGenerator"

const fixtures = resolve(__dirname, "..", "..", "_tests", "fixtures")

/** Returns a fixture. */
const loadFixture = (path: string): string => readFileSync(pathJoin(fixtures, path), {}).toString().replace(/\r/g, "")

/** Returns JSON from the fixtured dir */
export const requestWithFixturedJSON =
  async (path: string): Promise<() => Promise<any>> =>
  () =>
    Promise.resolve(JSON.parse(loadFixture(path)))

/** Returns arbitrary text value from a request */
export const requestWithFixturedContent =
  async (path: string): Promise<() => Promise<string>> =>
  () =>
    Promise.resolve(loadFixture(path))

/**
 * HACKish: Jest on Windows seems to include some additional
 * whitespace that differs from non-Windows snapshot output,
 * so we strip these until we can better-address the issue.
 */
const stripWhitespaceForSnapshot = (str: string) => {
  return str.replace(/\s/g, "")
}

const pullRequestInfoFilename = "bitbucket_cloud_pr.json"

describe("the dangerfile gitDSL - BitBucket Cloud", () => {
  let bbc: BitBucketCloud = {} as any
  let gitJSONDSL: GitJSONDSL = {} as any

  let bbcDSL: BitBucketCloudJSONDSL = {} as any
  let gitDSL: GitDSL = {} as any

  beforeEach(async () => {
    const api = new BitBucketCloudAPI(new FakeCI({}), {
      username: "username",
      password: "password",
      uuid: "{1234-1234-1234-1234}",
      type: "PASSWORD",
    })
    bbc = new BitBucketCloud(api)

    api.getPullRequestInfo = await requestWithFixturedJSON(pullRequestInfoFilename)
    api.getPullRequestComments = await requestWithFixturedJSON("bitbucket_cloud_comments.json")
    api.getPullRequestCommits = await requestWithFixturedJSON("bitbucket_cloud_commits.json")
    api.getPullRequestActivities = await requestWithFixturedJSON("bitbucket_cloud_activities.json")
    api.getPullRequestDiff = await requestWithFixturedContent("bitbucket_cloud_diff.diff")
    api.getFileContents = async (path, repoSlug, ref) => JSON.stringify({ path, repoSlug, ref })

    gitJSONDSL = await bbc.getPlatformGitRepresentation()
    bbcDSL = await bbc.getPlatformReviewDSLRepresentation()
    gitDSL = gitJSONToGitDSL(bbcDSL, gitJSONDSL, bbc.api)
  })

  it("sets the modified/created/deleted", async () => {
    expect(gitJSONDSL.modified_files).toEqual([
      "CHANGELOG.md",
      "data/schema.graphql",
      "data/schema.json",
      "externals/metaphysics",
      "lib/__mocks__/react-relay.js",
      "lib/components/artist/about.js",
      "lib/components/gene/header.js",
      "lib/containers/__tests__/__snapshots__/gene-tests.js.snap",
      "lib/containers/__tests__/gene-tests.js",
      "lib/containers/gene.js",
      "tsconfig.json",
    ])

    expect(gitJSONDSL.created_files).toEqual([
      "lib/components/gene/about.js",
      "lib/components/gene/biography.js",
      "lib/components/related_artists/index.js",
      "lib/components/related_artists/related_artist.js",
    ])

    expect(gitJSONDSL.deleted_files).toEqual([
      "lib/components/artist/related_artists/index.js",
      "lib/components/artist/related_artists/related_artist.js",
      "lib/components/gene/about_gene.js",
    ])
  })

  it("shows the diff for a specific file", async () => {
    const { diff } = (await gitDSL.diffForFile("tsconfig.json"))!

    expect(stripWhitespaceForSnapshot(diff)).toMatchSnapshot()
  })

  it("should include `before` text content of the file", async () => {
    const { before } = (await gitDSL.diffForFile("tsconfig.json"))!

    expect(stripWhitespaceForSnapshot(before)).toMatchSnapshot()
  })

  it("should include `after` text content of the file", async () => {
    const { after } = (await gitDSL.diffForFile("tsconfig.json"))!

    expect(stripWhitespaceForSnapshot(after)).toMatchSnapshot()
  })

  it("should include `added` text content of the file", async () => {
    const { added } = (await gitDSL.diffForFile("tsconfig.json"))!

    expect(stripWhitespaceForSnapshot(added)).toMatchSnapshot()
  })

  it("should include `removed` text content of the file", async () => {
    const { removed } = (await gitDSL.diffForFile("tsconfig.json"))!

    expect(stripWhitespaceForSnapshot(removed)).toMatchSnapshot()
  })

  it("resolves to `null` for files not in modified_files", async () => {
    const result = (await gitDSL.diffForFile("fuhqmahgads.json"))!

    expect(result).toBeNull()
  })

  it("shows the structured diff for a specific file", async () => {
    const { chunks } = (await gitDSL.structuredDiffForFile("tsconfig.json"))!
    expect(chunks).toMatchSnapshot()
  })

  it("sets up commit data correctly", async () => {
    const exampleCommit: GitCommit = {
      author: {
        date: "2019-05-13T13:24:53+00:00",
        email: "foo@bar.com",
        name: "Hello Core",
      },
      committer: {
        date: "2019-05-13T13:24:53+00:00",
        email: "foo@bar.com",
        name: "Hello Core",
      },
      message: "Merged in develop (pull request #174)\n\nDevelop to SIT\n\nApproved-by: Hello Core <foo@bar.com>\n",
      parents: ["77fdf99fcc08dce8bd49c9aedfc7442f2bd40bde", "a584f1256b8522cfce4ccc33dfbf157590a6044d"],
      sha: "7f73207cea935b2fd07a76028484c20eb18422ba",
      tree: null,
      url: "https://bitbucket.org/foo/bar/commits/7f73207cea935b2fd07a76028484c20eb18422ba",
    }

    expect(gitDSL.head).toBe("007bf2423436")
    expect(gitDSL.base).toBe("8a2eb414cb5d")
    expect(gitDSL.commits[0]).toEqual(exampleCommit)
  })

  it("writes a JSON DSL fixture", async () => {
    expect.assertions(1)
    expect(async () => {
      const fakeSource = new FakeCI({})
      const dataSent = await jsonDSLGenerator(bbc, fakeSource, {} as any)
      dataSent.settings.github.accessToken = "12345"

      writeFileSync(pathJoin(fixtures, "bbc-dsl-input.json"), JSON.stringify(dataSent, null, "  "), "utf8")
    }).not.toThrow()
  })
})

describe("bitBucketCloudRawAndDateToGitCommitAuthor", () => {
  const date = "2019-05-13T11:41:13+00:00"
  it("should convert name doesn't contain space correctly", () => {
    const raw = "Foo <foo@bar.com>"
    expect(bitBucketCloudRawAndDateToGitCommitAuthor(raw, date)).toEqual({
      name: "Foo",
      email: "foo@bar.com",
      date,
    })
  })
  it("should convert name contains one space correctly", () => {
    const raw = "Foo Bar <foo@bar.com>"
    expect(bitBucketCloudRawAndDateToGitCommitAuthor(raw, date)).toEqual({
      name: "Foo Bar",
      email: "foo@bar.com",
      date,
    })
  })
  it("should convert name contains multiple space correctly", () => {
    const raw = "Foo Bar Foo Bar Foo <foo@bar.com>"
    expect(bitBucketCloudRawAndDateToGitCommitAuthor(raw, date)).toEqual({
      name: "Foo Bar Foo Bar Foo",
      email: "foo@bar.com",
      date,
    })
  })
  it("should convert name contains special characters correctly", () => {
    const raw = "Foo Bar < Foo  @Bar >Foo <foo@bar.com>"
    expect(bitBucketCloudRawAndDateToGitCommitAuthor(raw, date)).toEqual({
      name: "Foo Bar < Foo  @Bar >Foo",
      email: "foo@bar.com",
      date,
    })
  })
  it("should convert email contains multiple dot correctly", () => {
    const raw = "Foo Bar <foo@bar.hello.com>"
    expect(bitBucketCloudRawAndDateToGitCommitAuthor(raw, date)).toEqual({
      name: "Foo Bar",
      email: "foo@bar.hello.com",
      date,
    })
  })
  it("should put raw into name if it couldn't convert", () => {
    const raw = "Foo Bar"
    expect(bitBucketCloudRawAndDateToGitCommitAuthor(raw, date)).toEqual({
      name: raw,
      email: "",
      date,
    })
  })
  it("should put only name if it couldn't find an email", () => {
    const raw = "Foo Bar <>"
    expect(bitBucketCloudRawAndDateToGitCommitAuthor(raw, date)).toEqual({
      name: "Foo Bar",
      email: "",
      date,
    })
  })
})
