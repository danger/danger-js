import { GitDSL, JSONPatchOperation, GitJSONDSL } from "../../dsl/GitDSL"
import { GitHubCommit, GitHubDSL } from "../../dsl/GitHubDSL"
import { GitCommit } from "../../dsl/Commit"

import { GitHubAPI } from "../github/GitHubAPI"

import * as os from "os"

import * as parseDiff from "parse-diff"

// At what point should we just import lodash?
import * as includes from "lodash.includes"
import * as isobject from "lodash.isobject"
import * as keys from "lodash.keys"

import * as jsonDiff from "rfc6902"
import * as jsonpointer from "jsonpointer"
import { diffToGitJSONDSL } from "../git/diffToGitJSONDSL"
import { GitJSONToGitDSLConfig, gitJSONToGitDSL } from "../git/gitJSONToGitDSL"

/**
 * Returns the response for the new comment
 *
 * @param {GitHubCommit} ghCommit A GitHub based commit
 * @returns {GitCommit} a Git commit representation without GH metadata
 */
function githubCommitToGitCommit(ghCommit: GitHubCommit): GitCommit {
  return {
    sha: ghCommit.sha,
    parents: ghCommit.parents.map(p => p.sha),
    author: ghCommit.commit.author,
    committer: ghCommit.commit.committer,
    message: ghCommit.commit.message,
    tree: ghCommit.commit.tree,
    url: ghCommit.url,
  }
}

export default async function gitDSLForGitHub(api: GitHubAPI): Promise<GitJSONDSL> {
  // We'll need all this info to be able to generate a working GitDSL object
  const diff = await api.getPullRequestDiff()
  const getCommits = await api.getPullRequestCommits()
  const commits = getCommits.map(githubCommitToGitCommit)
  return diffToGitJSONDSL(diff, commits)
}

export const gitHubGitDSL = (github: GitHubDSL, json: GitJSONDSL, githubAPI?: GitHubAPI): GitDSL => {
  // TODO: Remove the GitHubAPI
  // This is blocked by https://github.com/octokit/node-github/issues/602
  const ghAPI =
    githubAPI ||
    new GitHubAPI(
      { repoSlug: github.pr.head.repo.full_name, pullRequestID: String(github.pr.number) },
      process.env["DANGER_GITHUB_API_TOKEN"]
    )

  const config: GitJSONToGitDSLConfig = {
    repo: github.pr.head.repo.full_name,
    baseSHA: github.pr.base.sha,
    headSHA: github.pr.head.sha,
    getFileContents: github.utils.fileContents,
    getFullDiff: ghAPI.getPullRequestDiff,
  }

  return gitJSONToGitDSL(json, config)
}
