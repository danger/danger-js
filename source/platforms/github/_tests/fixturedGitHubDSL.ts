import { GitHub, githubJSONToGitHubDSL, GitHubType } from "../../GitHub"
import { GitHubAPI } from "../GitHubAPI"

import { FakeCI } from "../../../ci_source/providers/Fake"
import { readFileSync } from "fs"
import { resolve, join as pathJoin } from "path"
import { gitHubGitDSL as gitJSONToGitDSL } from "../GitHubGit"

import { Octokit as NodeGitHub } from "@octokit/rest"
import { GitHubDSL } from "../../../dsl/GitHubDSL"
import { GitDSL, GitJSONDSL } from "../../../dsl/GitDSL"
import { DangerDSLType } from "../../../dsl/DangerDSL"

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

const pullRequestInfoFilename = "github_pr.json"
// const masterSHA = JSON.parse(readFileSync(pathJoin(fixtures, pullRequestInfoFilename), {}).toString()).base.sha

export const fixturedGitHubDSL = async (): Promise<DangerDSLType> => {
  let github: GitHubType = {} as any
  let nodeGitHubAPI: NodeGitHub = {} as any
  let gitJSONDSL: GitJSONDSL = {} as any

  let githubDSL: GitHubDSL = {} as any
  let gitDSL: GitDSL = {} as any

  const api = new GitHubAPI(new FakeCI({}))
  github = GitHub(api)

  // Unused, but needed for DSL generation
  api.getIssue = () => Promise.resolve({})
  api.getReviews = () => Promise.resolve({})
  api.getReviewerRequests = () => Promise.resolve({})

  // Actually used
  api.getPullRequestInfo = await requestWithFixturedJSON(pullRequestInfoFilename)
  api.getPullRequestDiff = await requestWithFixturedContent("github_diff.diff")
  api.getPullRequestCommits = await requestWithFixturedJSON("github_commits.json")
  api.getFileContents = async (_path, _repoSlug, ref) => (await requestWithFixturedJSON(`static_file.${ref}.json`))()

  nodeGitHubAPI = new NodeGitHub()
  const mockContents = async ({ ref }: any) => (await requestWithFixturedJSON(`static_file.${ref}.json`))()
  nodeGitHubAPI.repos.getContents = mockContents as any

  gitJSONDSL = await github.getPlatformGitRepresentation()
  const githubJSONDSL = await github.getPlatformReviewDSLRepresentation()
  githubDSL = githubJSONToGitHubDSL(githubJSONDSL, nodeGitHubAPI)
  gitDSL = gitJSONToGitDSL(githubDSL, gitJSONDSL, github.api)

  return {
    // bitbucket_server: undefined,
    git: gitDSL,
    github: githubDSL,
    utils: {
      href: jest.fn() as any,
      sentence: jest.fn() as any,
    },
  } as any
}
