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
  // Note: This repetition feels bad, could the GitHub object cache JSON returned
  // from the API?

  // We'll need all this info to be able to generate a working GitDSL object
  const diff = await api.getPullRequestDiff()

  const fileDiffs: any[] = parseDiff(diff)

  const addedDiffs = fileDiffs.filter((diff: any) => diff["new"])
  const removedDiffs = fileDiffs.filter((diff: any) => diff["deleted"])
  const modifiedDiffs = fileDiffs.filter((diff: any) => !includes(addedDiffs, diff) && !includes(removedDiffs, diff))

  const getCommits = await api.getPullRequestCommits()
  return {
    modified_files: modifiedDiffs.map(d => d.to),
    created_files: addedDiffs.map(d => d.to),
    deleted_files: removedDiffs.map(d => d.from),
    commits: getCommits.map(githubCommitToGitCommit),
  }
}

export const gitJSONToGitDSL = (github: GitHubDSL, json: GitJSONDSL): GitDSL => {
  /**
   * Takes a filename, and pulls from the PR the two versions of a file
   * where we then pass that off to the rfc6902 JSON patch generator.
   *
   * @param filename The path of the file
   */
  const JSONPatchForFile = async (filename: string) => {
    // We already have access to the diff, so see if the file is in there
    // if it's not return an empty diff
    if (json.modified_files.includes(filename)) {
      return null
    }

    // Grab the two files contents.
    const baseFile = await github.utils.fileContents(filename, github.pr.base.repo.full_name, github.pr.base.sha)
    const headFile = await github.utils.fileContents(filename, github.pr.head.repo.full_name, github.pr.head.sha)

    // Parse JSON. `fileContents` returns empty string for files that are
    // missing in one of the refs, ie. when the file is created or deleted.
    const baseJSON = baseFile === "" ? {} : JSON.parse(baseFile)
    const headJSON = headFile === "" ? {} : JSON.parse(headFile)

    // Tiny bit of hand-waving here around the types. JSONPatchOperation is
    // a simpler version of all operations inside the rfc6902 d.ts. Users
    // of danger wont care that much, so I'm smudging the classes slightly
    // to be ones we can add to the hosted docs.
    return {
      before: baseFile === "" ? null : baseJSON,
      after: headFile === "" ? null : headJSON,
      diff: jsonDiff.createPatch(baseJSON, headJSON) as JSONPatchOperation[],
    }
  }

  /**
   * Takes a path, generates a JSON patch for it, then parses that into something
   * that's much easier to use inside a "DSL"" like the Dangerfile.
   *
   * @param filename path of the file
   */
  const JSONDiffForFile = async (filename: string) => {
    const patchObject = await JSONPatchForFile(filename)
    if (!patchObject) {
      return {}
    }

    // Thanks to @wtgtybhertgeghgtwtg for getting this started in #175
    // The idea is to loop through all the JSON patches, then pull out the before and after from those changes.

    const { diff, before, after } = patchObject
    return diff.reduce((accumulator, { path }) => {
      // We don't want to show the last root object, as these tend to just go directly
      // to a single value in the patch. This is fine, but not useful when showing a before/after
      const pathSteps = path.split("/")
      const backAStepPath = pathSteps.length <= 2 ? path : pathSteps.slice(0, pathSteps.length - 1).join("/")

      const diff: any = {
        after: jsonpointer.get(after, backAStepPath) || null,
        before: jsonpointer.get(before, backAStepPath) || null,
      }

      const emptyValueOfCounterpart = (other: any) => {
        if (Array.isArray(other)) {
          return []
        } else if (isobject(diff.after)) {
          return {}
        }
        return null
      }

      const beforeValue = diff.before || emptyValueOfCounterpart(diff.after)
      const afterValue = diff.after || emptyValueOfCounterpart(diff.before)

      // If they both are arrays, add some extra metadata about what was
      // added or removed. This makes it really easy to act on specific
      // changes to JSON DSLs

      if (Array.isArray(afterValue) && Array.isArray(beforeValue)) {
        const arrayBefore = beforeValue as any[]
        const arrayAfter = afterValue as any[]

        diff.added = arrayAfter.filter(o => !includes(arrayBefore, o))
        diff.removed = arrayBefore.filter(o => !includes(arrayAfter, o))
        // Do the same, but for keys inside an object if they both are objects.
      } else if (isobject(afterValue) && isobject(beforeValue)) {
        const beforeKeys = keys(beforeValue) as string[]
        const afterKeys = keys(afterValue) as string[]
        diff.added = afterKeys.filter(o => !includes(beforeKeys, o))
        diff.removed = beforeKeys.filter(o => !includes(afterKeys, o))
      }

      jsonpointer.set(accumulator, backAStepPath, diff)
      return accumulator
    }, Object.create(null))
  }

  const byType = (t: string) => ({ type }: { type: string }) => type === t
  const getContent = ({ content }: { content: string }) => content

  type Changes = { type: string; content: string }[]
  /**
   * Gets the git-style diff for a single file.
   *
   * @param filename File path for the diff
   */
  const diffForFile = async (filename: string) => {
    // TODO: Remove GitHubAPI  by switching entirely to node-github
    // See https://github.com/octokit/node-github/issues/602

    const ghAPI = new GitHubAPI(
      { repoSlug: github.pr.head.repo.full_name, pullRequestID: String(github.pr.number) },
      process.env["DANGER_GITHUB_API_TOKEN"]
    )

    const diff = await ghAPI.getPullRequestDiff()

    const fileDiffs: any[] = parseDiff(diff)
    const structuredDiff = fileDiffs.find((diff: any) => diff.from === filename || diff.to === filename)
    if (!structuredDiff) {
      return null
    }

    const allLines = structuredDiff.chunks
      .map((c: { changes: Changes }) => c.changes)
      .reduce((a: Changes, b: Changes) => a.concat(b), [])

    return {
      before: await github.utils.fileContents(filename, github.pr.base.repo.full_name, github.pr.base.sha),

      after: await github.utils.fileContents(filename, github.pr.head.repo.full_name, github.pr.head.sha),

      diff: allLines.map(getContent).join(os.EOL),

      added: allLines
        .filter(byType("add"))
        .map(getContent)
        .join(os.EOL),

      removed: allLines
        .filter(byType("del"))
        .map(getContent)
        .join(os.EOL),
    }
  }

  return {
    modified_files: json.modified_files,
    created_files: json.created_files,
    deleted_files: json.deleted_files,
    commits: json.commits,
    diffForFile,
    JSONPatchForFile,
    JSONDiffForFile,
  }
}
