import { GitHubPRDSL, GitHubDSL, GitHubAPIPR, GitHubJSONDSL } from "../dsl/GitHubDSL"
import { GitHubAPI } from "./github/GitHubAPI"
import GitHubUtils from "./github/GitHubUtils"
import gitDSLForGitHub from "./github/GitHubGit"

import NodeGitHub from "@octokit/rest"
import { Platform } from "./platform"

import { GitHubIssueCommenter } from "./github/comms/issueCommenter"
import { GitHubChecksCommenter } from "./github/comms/checksCommenter"

/** Handles conforming to the Platform Interface for GitHub, API work is handle by GitHubAPI */

export type GitHubType = Platform & { api: GitHubAPI }

export const GitHub = (api: GitHubAPI) => {
  /**
   * Converts the PR JSON into something easily used by the Github API client.
   */
  const APIMetadataForPR = (pr: GitHubPRDSL): GitHubAPIPR => {
    return {
      number: pr.number,
      repo: pr.base.repo.name,
      owner: pr.base.repo.owner.login,
    }
  }

  /** A quick one off func to ensure there's always some labels */
  const getIssue = async () => {
    const issue = await api.getIssue()
    return issue || { labels: [] }
  }

  return {
    name: "GitHub",

    api,
    getReviewInfo: api.getPullRequestInfo,
    getPlatformGitRepresentation: () => gitDSLForGitHub(api),

    getPlatformDSLRepresentation: async () => {
      let pr: GitHubPRDSL
      try {
        pr = await api.getPullRequestInfo()
      } catch {
        process.exitCode = 1
        throw `
          Could not find pull request information,
          if you are using a private repo then perhaps
          Danger does not have permission to access that repo.
        `
      }

      const issue = await getIssue()
      const commits = await api.getPullRequestCommits()
      const reviews = await api.getReviews()
      const requested_reviewers = await api.getReviewerRequests()

      const thisPR = APIMetadataForPR(pr)
      return {
        issue,
        pr,
        commits,
        reviews,
        requested_reviewers,
        thisPR,
      }
    },

    ...GitHubIssueCommenter(api),
    ...(GitHubChecksCommenter(api) || {}),

    getFileContents: api.fileContents,
    executeRuntimeEnvironment,
  } as GitHubType
}

// This class should get un-classed, but for now we can expand by functions
export const githubJSONToGitHubDSL = (gh: GitHubJSONDSL, api: NodeGitHub): GitHubDSL => {
  return {
    ...gh,
    api,
    utils: GitHubUtils(gh.pr, api),
  }
}

import * as overrideRequire from "override-require"
import { customGitHubResolveRequest, dangerPrefix, shouldUseGitHubOverride } from "./github/customGitHubRequire"
import { DangerRunner } from "../runner/runners/runner"
import { existsSync, readFileSync } from "fs"

const executeRuntimeEnvironment = async (
  start: DangerRunner["runDangerfileEnvironment"],
  dangerfilePath: string,
  environment: any
) => {
  const token = process.env["DANGER_GITHUB_API_TOKEN"] || process.env["GITHUB_TOKEN"]!
  // Use custom module resolution to handle github urls instead of just fs access
  const restoreOriginalModuleLoader = overrideRequire(shouldUseGitHubOverride, customGitHubResolveRequest(token))

  // We need to validate that the
  // dangerfile comes from the web, and do all the prefixing etc

  let path: string
  let content: string
  if (existsSync(dangerfilePath)) {
    path = dangerfilePath
    content = readFileSync(dangerfilePath, "utf8")
  } else {
    path = dangerPrefix + dangerfilePath
    content = await customGitHubResolveRequest(token)(dangerfilePath, { filename: dangerfilePath })
  }

  await start([path], [content], environment)

  // Undo the runtime
  restoreOriginalModuleLoader()
}
