import { GitJSONDSL, GitDSL } from "../../dsl/GitDSL"
import { BitBucketCloudAPI } from "./BitBucketCloudAPI"
import { diffToGitJSONDSL } from "../git/diffToGitJSONDSL"
import { BitBucketCloudCommit, BitBucketCloudJSONDSL } from "../../dsl/BitBucketCloudDSL"
import { GitCommit, GitCommitAuthor } from "../../dsl/Commit"
import { GitJSONToGitDSLConfig, gitJSONToGitDSL } from "../git/gitJSONToGitDSL"

import { debug } from "../../debug"
const d = debug("BitBucketCloudGit")

export function bitBucketCloudRawAndDateToGitCommitAuthor(raw: string, date: string): GitCommitAuthor {
  const startIndexOfEmail = raw.lastIndexOf("<")
  const endIndexOfEmail = raw.lastIndexOf(">")
  if (startIndexOfEmail === -1 || endIndexOfEmail === -1) {
    return {
      name: raw,
      email: "",
      date,
    }
  }
  const name = raw.substring(0, startIndexOfEmail).trim()
  const email = raw.substring(startIndexOfEmail + 1, endIndexOfEmail).trim()
  return {
    name,
    email,
    date,
  }
}

function bitBucketCloudCommitToGitCommit(commit: BitBucketCloudCommit): GitCommit {
  const user = bitBucketCloudRawAndDateToGitCommitAuthor(commit.author.raw, commit.date)

  return {
    sha: commit.hash,
    author: user,
    committer: user,
    message: commit.message,
    tree: null,
    parents: commit.parents != null ? commit.parents.map((parent) => parent.hash) : undefined,
    url: commit.links.html.href,
  }
}

export default async function gitDSLForBitBucketCloud(api: BitBucketCloudAPI): Promise<GitJSONDSL> {
  // We'll need all this info to be able to generate a working GitDSL object
  const diffs = await api.getPullRequestDiff()
  const gitCommits = await api.getPullRequestCommits()
  const commits = gitCommits.map(bitBucketCloudCommitToGitCommit)
  return diffToGitJSONDSL(diffs, commits)
}

export const bitBucketCloudGitDSL = (
  bitBucketCloud: BitBucketCloudJSONDSL,
  json: GitJSONDSL,
  bitBucketCloudAPI: BitBucketCloudAPI
): GitDSL => {
  const config: GitJSONToGitDSLConfig = {
    repo: bitBucketCloud.pr.source.repository.full_name,
    baseSHA: bitBucketCloud.pr.destination.commit.hash,
    headSHA: bitBucketCloud.pr.source.commit.hash,
    getFileContents: bitBucketCloudAPI.getFileContents,
    getFullDiff: bitBucketCloudAPI.getPullRequestDiff,
  }

  d("Setting up git DSL with: ", config)
  return gitJSONToGitDSL(json, config)
}
