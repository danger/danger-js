import { GitDSL, GitJSONDSL } from "../../dsl/GitDSL"
import { BitBucketServerCommit, BitBucketServerDSL } from "../../dsl/BitBucketServerDSL"
import { GitCommit } from "../../dsl/Commit"

import { BitBucketServerAPI } from "../bitbucket_server/BitBucketServerAPI"

import { diffToGitJSONDSL } from "../git/diffToGitJSONDSL"
import { GitJSONToGitDSLConfig, gitJSONToGitDSL } from "../git/gitJSONToGitDSL"

import * as debug from "debug"
import { RepoMetaData } from "../../ci_source/ci_source"
const d = debug("danger:BitBucketServerGit")

/**
 * Returns the response for the new comment
 *
 * @param {BitBucketServerCommit} ghCommit A BitBucketServer based commit
 * @returns {GitCommit} a Git commit representation without GH metadata
 */
function bitBucketServerCommitToGitCommit(
  bbsCommit: BitBucketServerCommit,
  repoMetadata: RepoMetaData,
  host: string
): GitCommit {
  const url = `${host}/${repoMetadata.repoSlug}/commits/${bbsCommit.id}`
  return {
    sha: bbsCommit.id,
    parents: bbsCommit.parents.map(p => p.id),
    author: {
      email: bbsCommit.author.emailAddress,
      name: bbsCommit.author.name,
      date: new Date(bbsCommit.authorTimestamp).toISOString(),
    },
    committer: {
      email: bbsCommit.committer.emailAddress,
      name: bbsCommit.committer.name,
      date: new Date(bbsCommit.committerTimestamp).toISOString(),
    },
    message: bbsCommit.message,
    tree: null,
    url,
  }
}

export default async function gitDSLForBitBucketServer(api: BitBucketServerAPI): Promise<GitJSONDSL> {
  // We'll need all this info to be able to generate a working GitDSL object
  const diff = await api.getPullRequestDiff()
  const gitCommits = await api.getPullRequestCommits()
  const commits = gitCommits.map(commit =>
    bitBucketServerCommitToGitCommit(commit, api.repoMetadata, api.repoCredentials.host)
  )
  return diffToGitJSONDSL(diff, commits)
}

export const bitBucketServerGitDSL = (
  bitBucketServer: BitBucketServerDSL,
  json: GitJSONDSL,
  bitBucketServerAPI: BitBucketServerAPI
): GitDSL => {
  const config: GitJSONToGitDSLConfig = {
    repo: `${bitBucketServer.pr.fromRef.repository.project.key}/${bitBucketServer.pr.fromRef.repository.slug}`,
    baseSHA: bitBucketServer.pr.fromRef.latestCommit,
    headSHA: bitBucketServer.pr.toRef.latestCommit,
    getFileContents: bitBucketServerAPI.getFileContents,
    getFullDiff: bitBucketServerAPI.getPullRequestDiff,
  }

  d("Setting up git DSL with: ", config)
  return gitJSONToGitDSL(json, config)
}
