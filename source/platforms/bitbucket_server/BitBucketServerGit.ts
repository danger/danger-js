import { GitDSL, GitJSONDSL } from "../../dsl/GitDSL"
import {
  BitBucketServerCommit,
  BitBucketServerDiff,
  BitBucketServerJSONDSL,
  RepoMetaData,
  BitBucketServerChangesValue,
} from "../../dsl/BitBucketServerDSL"
import { GitCommit } from "../../dsl/Commit"

import { BitBucketServerAPI } from "./BitBucketServerAPI"

import { GitJSONToGitDSLConfig, gitJSONToGitDSL, GitStructuredDiff, Changes } from "../git/gitJSONToGitDSL"

import { debug } from "../../debug"
const d = debug("BitBucketServerGit")

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
    committer: bbsCommit.committer
      ? {
          email: bbsCommit.committer.emailAddress,
          name: bbsCommit.committer.name,
          date: new Date(bbsCommit.committerTimestamp).toISOString(),
        }
      : {
          email: bbsCommit.author.emailAddress,
          name: bbsCommit.author.name,
          date: new Date(bbsCommit.authorTimestamp).toISOString(),
        },
    message: bbsCommit.message,
    tree: null,
    url,
  }
}

export default async function gitDSLForBitBucketServer(api: BitBucketServerAPI): Promise<GitJSONDSL> {
  // We'll need all this info to be able to generate a working GitDSL object
  const changes = await api.getPullRequestChanges()
  const gitCommits = await api.getPullRequestCommits()
  const commits = gitCommits.map(commit =>
    bitBucketServerCommitToGitCommit(commit, api.repoMetadata, api.repoCredentials.host)
  )
  return bitBucketServerChangesToGitJSONDSL(changes, commits)
}

export const bitBucketServerGitDSL = (
  bitBucketServer: BitBucketServerJSONDSL,
  json: GitJSONDSL,
  bitBucketServerAPI: BitBucketServerAPI
): GitDSL => {
  const config: GitJSONToGitDSLConfig = {
    repo:
      `projects/${bitBucketServer.pr.fromRef.repository.project.key}/` +
      `repos/${bitBucketServer.pr.fromRef.repository.slug}`,
    baseSHA: bitBucketServer.pr.toRef.latestCommit,
    headSHA: bitBucketServer.pr.fromRef.latestCommit,
    getFileContents: bitBucketServerAPI.getFileContents,
    getStructuredDiffForFile: async (base: string, head: string, filename: string) => {
      const diff = await bitBucketServerAPI.getStructuredDiffForFile(base, head, filename)
      return bitBucketServerDiffToGitStructuredDiff(diff)
    },
  }

  d("Setting up git DSL with: ", config)
  return gitJSONToGitDSL(json, config)
}

const bitBucketServerChangesToGitJSONDSL = (
  changes: BitBucketServerChangesValue[],
  commits: GitCommit[]
): GitJSONDSL => {
  return changes.reduce<GitJSONDSL>(
    (git, value) => {
      // See: https://docs.atlassian.com/bitbucket-server/javadoc/4.1.0/api/reference/com/atlassian/bitbucket/content/ChangeType.html
      switch (value.type) {
        case "ADD":
        case "COPY":
          return {
            ...git,
            created_files: [...git.created_files, value.path.toString],
          }
        case "MODIFY":
          return {
            ...git,
            modified_files: [...git.modified_files, value.path.toString],
          }
        case "MOVE":
          return {
            ...git,
            created_files: [...git.created_files, value.path.toString],
            deleted_files: [...git.deleted_files, value.srcPath.toString],
          }
        case "DELETE":
          return {
            ...git,
            deleted_files: [...git.deleted_files, value.path.toString],
          }
        default:
          return {
            ...git,
          }
      }
    },
    {
      modified_files: [],
      created_files: [],
      deleted_files: [],
      commits,
    }
  )
}

const bitBucketServerDiffToGitStructuredDiff = (diffs: BitBucketServerDiff[]): GitStructuredDiff => {
  // We need all changed lines with it's type. It will convert hunk segment lines to flatten changed lines.
  const segmentValues = { ADDED: "add", CONTEXT: "normal", REMOVED: "del" } as const
  return diffs.map(diff => ({
    from: diff.source && diff.source.toString,
    to: diff.destination && diff.destination.toString,
    chunks:
      diff.hunks &&
      diff.hunks.map(hunk => ({
        content: `@@ -${hunk.sourceLine},${hunk.sourceSpan} +${hunk.destinationLine},${hunk.destinationSpan} @@`,
        oldStart: hunk.sourceLine,
        oldLines: hunk.sourceSpan,
        newStart: hunk.destinationLine,
        newLines: hunk.destinationSpan,
        changes: hunk.segments
          .map(segment => {
            const type = segmentValues[segment.type]
            if (type === "add") {
              return segment.lines.map(line => {
                return {
                  type,
                  add: true as const,
                  content: line.line,
                  ln: line.destination,
                }
              })
            }
            if (type === "del") {
              return segment.lines.map(line => {
                return {
                  type,
                  del: true as const,
                  content: line.line,
                  ln: line.source,
                }
              })
            }
            if (type === "normal") {
              return segment.lines.map(line => {
                return {
                  type,
                  normal: true as const,
                  content: line.line,
                  ln1: line.source,
                  ln2: line.destination,
                }
              })
            }
            // unknown type: ${type}
            return []
          })
          .reduce((a, b) => a.concat(b), [] as Changes),
      })),
  }))
}
