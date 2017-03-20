import { GitDSL, JSONPatchOperation } from "../../dsl/GitDSL"
import { GitHubCommit } from "../../dsl/GitHubDSL"
import { GitCommit } from "../../dsl/Commit"

import { GitHubAPI } from "../GitHub/GitHubAPI"

import * as os from "os"

import * as parseDiff from "parse-diff"
import * as includes from "lodash.includes"
import * as isarray from "lodash.isarray"
import * as find from "lodash.find"

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
    tree: ghCommit.commit.tree
  }
}

export default async function gitDSLForGitHub(api: GitHubAPI): Promise<GitDSL> {
  // Note: This repetition feels bad, could the GitHub object cache JSON returned
  // from the API?

  // We'll need all this info to be able to generate a working GitDSL object

  const pr = await api.getPullRequestInfo()
  const diff = await api.getPullRequestDiff()
  const getCommits = await api.getPullRequestCommits()

  const fileDiffs: Array<any> = parseDiff(diff)

  const addedDiffs = fileDiffs.filter((diff: any) => diff["new"])
  const removedDiffs = fileDiffs.filter((diff: any) => diff["deleted"])
  const modifiedDiffs = fileDiffs.filter((diff: any) => !includes(addedDiffs, diff) && !includes(removedDiffs, diff))

  /**
   * Takes a filename, and pulls from the PR the two versions of a file
   * where we then pass that off to the rfc6902 JSON patch generator.
   *
   * @param filename The path of the file
   */
  const JSONPatchForFile = async (filename: string) => {
    // We already have access to the diff, so see if the file is in there
    // if it's not return an empty diff
    const modified = modifiedDiffs.find((diff) => diff.to === filename)
    if (!modified) { return null }

    // Grab the two files contents.
    const baseFile = await api.fileContents(filename, pr.base.repo.full_name, pr.base.ref)
    const headFile = await api.fileContents(filename, pr.head.repo.full_name, pr.head.ref)

    if (baseFile && headFile) {
      // Parse JSON
      const baseJSON = JSON.parse(baseFile)
      const headJSON = JSON.parse(headFile)
      // Tiny bit of hand-waving here around the types. JSONPatchOperation is
      // a simpler version of all operations inside the rfc6902 d.ts. Users
      // of danger wont care that much, so I'm smudging the classes slightly
      // to be ones we can add to the hosted docs.
      return {
        before: baseJSON,
        after: headJSON,
        diff: jsonDiff.createPatch(baseJSON, headJSON) as JSONPatchOperation[]
      }
    }
    return null
  }

  /**
   * Takes a path, generates a JSON patch for it, then parses that into something
   * that's much easier to use inside a "DSL"" like the Dangerfile.
   *
   * @param filename path of the file
   */
  const JSONDiffForFile = async (filename: string) => {
    const patchObject = await JSONPatchForFile(filename)
    if (!patchObject) { return {} }

    // Thanks to @wtgtybhertgeghgtwtg for getting this started in #175
    // The idea is to loop through all the JSON patches, then pull out the before and after from those changes.

    const { diff, before, after } = patchObject
    return diff.reduce((accumulator, { path }) => {

      // We don't want to show the last root object, as these tend to just go directly
      // to a single value in the patch. This is fine, but not useful when showing a before/after
      const pathSteps = path.split("/")
      const backAStepPath = pathSteps.length <= 2 ? path : pathSteps.slice(0, pathSteps.length - 1).join("/")

      const diff: any = {
        after: jsonpointer.get(after, backAStepPath),
        before: jsonpointer.get(before, backAStepPath),
      }

      // If they both are arrays, add some extra metadata about what was
      // added or removed. This makes it really easy to act on specific
      // changes to JSON DSLs

      if (isarray(diff.after) && isarray(diff.before)) {
        const arrayBefore = diff.before as any[]
        const arrayAfter = diff.after as any[]

        diff.added = arrayAfter.filter(o => !includes(arrayBefore, o))
        diff.removed = arrayBefore.filter(o => !includes(arrayAfter, o))
      }

      jsonpointer.set(accumulator, backAStepPath, diff)
      return accumulator
    }, Object.create(null))
  }

/**
 * Gets the git-style diff for a single file.
 *
 * @param name File path for the diff
 */
  const diffForFile = (name: string) => {
    const diff = find(fileDiffs, (diff: any) => diff.from === name || diff.to === name)
    if (!diff) { return null }

    const changes = diff.chunks.map((c: any) => c.changes)
                               .reduce((a: any, b: any) => a.concat(b), [])
    const lines = changes.map((c: any) => c.content)
    return lines.join(os.EOL)
  }

  return {
    modified_files: modifiedDiffs.map(d => d.to),
    created_files: addedDiffs.map(d => d.to),
    deleted_files: removedDiffs.map(d => d.from),
    diffForFile,
    commits: getCommits.map(githubCommitToGitCommit),
    JSONPatchForFile,
    JSONDiffForFile
  }
}
