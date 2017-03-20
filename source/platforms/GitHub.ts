import { GitDSL, JSONPatchOperation } from "../dsl/GitDSL"
import { GitCommit } from "../dsl/Commit"
import { GitHubPRDSL, GitHubCommit, GitHubDSL, GitHubIssue, GitHubIssueLabel } from "../dsl/GitHubDSL"
import { GitHubAPI } from "./github/GitHubAPI"
import GitHubUtils from "./github/GitHubUtils"

import * as parseDiff from "parse-diff"
import * as includes from "lodash.includes"
import * as isarray from "lodash.isarray"
import * as find from "lodash.find"

import * as jsonDiff from "rfc6902"
import * as jsonpointer from "jsonpointer"

import * as os from "os"

/** Handles conforming to the Platform Interface for GitHub, API work is handle by GitHubAPI */

export class GitHub {
  name: string

  constructor(public readonly api: GitHubAPI) {
    this.name = "GitHub"
  }

  /**
   * Get the Code Review description metadata
   *
   * @returns {Promise<any>} JSON representation
   */
  async getReviewInfo(): Promise<GitHubPRDSL> {
    return await this.api.getPullRequestInfo()
  }

  /**
   * Get the Code Review diff representation
   *
   * @returns {Promise<GitDSL>} the git DSL
   */
  async getReviewDiff(): Promise<GitDSL> {
    // Note: This repetition is bad, could the GitHub object cache JSON returned
    // from the API?
    const pr = await this.getReviewInfo()
    const diff = await this.api.getPullRequestDiff()
    const getCommits = await this.api.getPullRequestCommits()

    const fileDiffs: Array<any> = parseDiff(diff)

    const addedDiffs = fileDiffs.filter((diff: any) => diff["new"])
    const removedDiffs = fileDiffs.filter((diff: any) => diff["deleted"])
    const modifiedDiffs = fileDiffs.filter((diff: any) => !includes(addedDiffs, diff) && !includes(removedDiffs, diff))

    const JSONPatchForFile = async (filename: string) => {
      // We already have access to the diff, so see if the file is in there
      // if it's not return an empty diff
      const modified = modifiedDiffs.find((diff) => diff.to === filename)
      if (!modified) { return null }

      // Grab the two files contents.
      const baseFile = await this.api.fileContents(filename, pr.base.repo.full_name, pr.base.ref)
      const headFile = await this.api.fileContents(filename, pr.head.repo.full_name, pr.head.ref)

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

    return {
      modified_files: modifiedDiffs.map(d => d.to),
      created_files: addedDiffs.map(d => d.to),
      deleted_files: removedDiffs.map(d => d.from),
      diffForFile: (name: string) => {
        const diff = find(fileDiffs, (diff: any) => diff.from === name || diff.to === name)
        if (!diff) { return null }

        const changes = diff.chunks.map((c: any) => c.changes)
                                   .reduce((a: any, b: any) => a.concat(b), [])
        const lines = changes.map((c: any) => c.content)
        return lines.join(os.EOL)
      },
      commits: getCommits.map(this.githubCommitToGitCommit),
      JSONPatchForFile,
      JSONDiffForFile: async (filename) => {
        const patchObject = await JSONPatchForFile(filename)
        if (!patchObject) { return {} }

        // Thanks to @wtgtybhertgeghgtwtg for getting this started in #175
        // The idea is to loop through all the JSON patches, then pull out the before and after from those changes.

        const {diff, before, after} = patchObject
        return diff.reduce((accumulator, {path}) => {

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
    }
  }

  async getIssue(): Promise <GitHubIssue> {
    const issue = await this.api.getIssue()
    if (!issue) {
      return { labels: [] }
    }
    const labels = issue.labels.map((label: any): GitHubIssueLabel => ({
      id: label.id,
      url: label.url,
      name: label.name,
      color: label.color,
    }))

    return { labels }
  }

  /**
   * Returns the `github` object on the Danger DSL
   *
   * @returns {Promise<GitHubDSL>} JSON response of the DSL
   */
  async getPlatformDSLRepresentation(): Promise <GitHubDSL> {
    const pr = await this.getReviewInfo()
    if (pr === {}) {
      process.exitCode = 1
      throw `
        Could not find pull request information,
        if you are using a private repo then perhaps
        Danger does not have permission to access that repo.
      `
    }

    const issue = await this.getIssue()
    const commits = await this.api.getPullRequestCommits()
    const reviews = await this.api.getReviews()
    const requested_reviewers = await this.api.getReviewerRequests()

    return {
      issue,
      pr,
      commits,
      reviews,
      requested_reviewers,
      utils: GitHubUtils(pr)
    }
  }

  /**
   * Returns the response for the new comment
   *
   * @param {GitHubCommit} ghCommit A GitHub based commit
   * @returns {GitCommit} a Git commit representation without GH metadata
   */
  githubCommitToGitCommit(ghCommit: GitHubCommit): GitCommit {
    return {
      sha: ghCommit.sha,
      parents: ghCommit.parents.map(p => p.sha),
      author: ghCommit.commit.author,
      committer: ghCommit.commit.committer,
      message: ghCommit.commit.message,
      tree: ghCommit.commit.tree
    }
  }

  /**
   * Returns the response for the new comment
   *
   * @param {string} comment you want to post
   * @returns {Promise<any>} JSON response of new comment
   */
  async createComment(comment: string): Promise <any> {
    return this.api.postPRComment(comment)
  }

  // In Danger RB we support a danger_id property,
  // this should be handled at some point

  /**
   * Deletes the main Danger comment, used when you have
   * fixed all your failures.
   *
   * @returns {Promise<boolean>} did it work?
   */
  async deleteMainComment(): Promise <boolean> {
    const commentID = await this.api.getDangerCommentID()
    if (commentID) {
      await this.api.deleteCommentWithID(commentID)
    }

    return commentID !== null
  }

  /**
   * Either updates an existing comment, or makes a new one
   *
   * @param {string} newComment string value of comment
   * @returns {Promise<boolean>} success of posting comment
   */
  async updateOrCreateComment(newComment: string): Promise <boolean> {
    const commentID = await this.api.getDangerCommentID()
    if (commentID) {
      await this.api.updateCommentWithID(commentID, newComment)
    } else {
      await this.createComment(newComment)
    }
    return true
  }

  /**
   * Updates the main Danger comment, when Danger has run
   * more than once
   *
   * @param {string} comment updated text
   *
   * @returns {Promise<boolean>} did it work?
   */
  async editMainComment(comment: string): Promise <boolean> {
    const commentID = await this.api.getDangerCommentID()
    if (commentID) { await this.api.updateCommentWithID(commentID, comment) }
    return commentID !== null
  }
}
