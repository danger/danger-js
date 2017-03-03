import { GitDSL } from "../dsl/GitDSL"
import { GitCommit } from "../dsl/Commit"
import { GitHubPRDSL, GitHubCommit, GitHubDSL, GitHubIssue, GitHubIssueLabel } from "../dsl/GitHubDSL"
import { GitHubAPI } from "./github/GitHubAPI"

import * as parseDiff from "parse-diff"
import * as includes from "lodash.includes"
import * as find from "lodash.find"

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
    const deets = await this.api.getPullRequestInfo()

    return {
      ...await deets.json(),
      reviews: await this.api.getReviews(),
      requestedReviewers: await this.api.getReviewerRequests(),
    }
  }

  /**
   * Get the Code Review diff representation
   *
   * @returns {Promise<GitDSL>} the git DSL
   */
  async getReviewDiff(): Promise<GitDSL> {
    const diffReq = await this.api.getPullRequestDiff()
    const getCommitsResponse = await this.api.getPullRequestCommits()
    const getCommits = await getCommitsResponse.json()

    const diff = await diffReq.text()

    const fileDiffs: Array<any> = parseDiff(diff)

    const addedDiffs = fileDiffs.filter((diff: any) => diff["new"])
    const removedDiffs = fileDiffs.filter((diff: any) => diff["deleted"])
    const modifiedDiffs = fileDiffs.filter((diff: any) => !includes(addedDiffs, diff) && !includes(removedDiffs, diff))
    return {
      modified_files: modifiedDiffs.map((d: any) => d.to),
      created_files: addedDiffs.map((d: any) => d.to),
      deleted_files: removedDiffs.map((d: any) => d.from),
      diffForFile: (name: string) => {
        const diff = find(fileDiffs, (diff: any) => diff.from === name || diff.to === name)
        if (!diff) { return null }

        const changes = diff.chunks.map((c: any) => c.changes)
          .reduce((a: any, b: any) => a.concat(b), [])
        const lines = changes.map((c: any) => c.content)
        return lines.join(os.EOL)
      },
      commits: getCommits.map(this.githubCommitToGitCommit)
    }
  }

  async getIssue(): Promise<GitHubIssue> {
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

    return {
      labels,
    }
  }

  /**
   * Returns the `github` object on the Danger DSL
   *
   * @returns {Promise<GitHubDSL>} JSON response of the DSL
   */
  async getPlatformDSLRepresentation(): Promise<GitHubDSL> {
    const issue = await this.getIssue()
    const pr = await this.getReviewInfo()
    const commits = await this.api.getPullRequestCommits()
    return {
      issue,
      pr,
      commits
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
  async createComment(comment: string): Promise<any> {
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
  async deleteMainComment(): Promise<boolean> {
    const commentID = await this.api.getDangerCommentID()
    if (commentID) { await this.api.deleteCommentWithID(commentID) }
    return commentID !== null
  }

  /**
   * Either updates an existing comment, or makes a new one
   *
   * @param {string} newComment string value of comment
   * @returns {Promise<boolean>} success of posting comment
   */
  async updateOrCreateComment(newComment: string): Promise<boolean> {
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
  async editMainComment(comment: string): Promise<boolean> {
    const commentID = await this.api.getDangerCommentID()
    if (commentID) { await this.api.updateCommentWithID(commentID, comment) }
    return commentID !== null
  }
}
