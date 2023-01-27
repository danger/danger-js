import { GitJSONDSL, GitDSL } from "../dsl/GitDSL"
import { BitBucketCloudPRDSL, BitBucketCloudJSONDSL, BitBucketCloudDSL } from "../dsl/BitBucketCloudDSL"
import { BitBucketCloudAPI } from "./bitbucket_cloud/BitBucketCloudAPI"
import gitDSLForBitBucketCloud from "./bitbucket_cloud/BitBucketCloudGit"

import { Platform, Comment } from "./platform"

import { debug } from "../debug"

export class BitBucketCloud implements Platform {
  private readonly d = debug("BitBucketCloud")
  name: string

  constructor(public readonly api: BitBucketCloudAPI) {
    this.name = "BitBucketCloud"
  }

  /**
   * Get the Code Review description metadata
   *
   * @returns {Promise<any>} JSON representation
   */
  getReviewInfo = (): Promise<BitBucketCloudPRDSL> => this.api.getPullRequestInfo()

  /**
   * Get the Code Review diff representation
   *
   * @returns {Promise<GitDSL>} the git DSL
   */
  getPlatformGitRepresentation = (): Promise<GitJSONDSL> => gitDSLForBitBucketCloud(this.api)

  /**
   * Returns the `bitbucket_cloud` object on the Danger DSL
   *
   * @returns {Promise<BitBucketCloudJSONDSL>} JSON response of the DSL
   */

  getPlatformReviewDSLRepresentation = async (): Promise<BitBucketCloudJSONDSL> => {
    let pr: BitBucketCloudPRDSL
    try {
      pr = await this.getReviewInfo()
    } catch {
      process.exitCode = 1
      throw `
          Could not find pull request information,
          perhaps Danger does not have permission to access the repo.
        `
    }

    const commits = await this.api.getPullRequestCommits()
    const comments = await this.api.getPullRequestComments()
    const activities = await this.api.getPullRequestActivities()
    return {
      metadata: this.api.repoMetadata,
      pr,
      commits,
      comments,
      activities,
    }
  }

  supportsCommenting() {
    return true
  }

  supportsInlineComments() {
    return true
  }

  /**
   * Returns the response for the new comment
   *
   * @param {string} comment you want to post
   * @returns {Promise<any>} JSON response of new comment
   */
  createComment = (comment: string) => this.api.postPRComment(comment)

  /**
   * Deletes the main Danger comment, used when you have
   * fixed all your failures.
   *
   * @returns {Promise<boolean>} did it work?
   */
  deleteMainComment = async (dangerID: string): Promise<boolean> => {
    const comments = await this.api.getDangerMainComments(dangerID)
    for (let comment of comments) {
      await this.api.deleteComment(comment.id.toString())
    }

    return comments.length > 0
  }

  /**
   * Either updates an existing comment, or makes a new one
   *
   * @param {string} dangerID the UUID for the run
   * @param {string} newComment string value of comment
   * @returns {Promise<string>} the URL for the comment
   */
  async updateOrCreateComment(dangerID: string, newComment: string): Promise<string | undefined> {
    const comments = await this.api.getDangerMainComments(dangerID)
    let issue = null

    if (comments.length) {
      // Edit the first comment
      issue = await this.api.updateComment(comments[0].id.toString(), newComment)

      // Delete any dupes
      for (let comment of comments) {
        if (comment !== comments[0]) {
          await this.api.deleteComment(comment.id.toString())
        }
      }
    } else {
      issue = await this.createComment(newComment)
    }
    if (issue && issue.links && issue.links.html && issue.links.html.href) {
      return issue.links.html.href
    }
    return undefined
  }

  getInlineComments = async (dangerID: string): Promise<Comment[]> => this.api.getDangerInlineComments(dangerID)

  createInlineComment = async (git: GitDSL, comment: string, path: string, line: number): Promise<any> => {
    this.d("Trying to get inline comment:" + comment + " atPath: " + path + " line: " + line)
    this.d("GIT: " + git)

    return this.api.postInlinePRComment(comment, line, path)
  }

  updateInlineComment = async (comment: string, commentId: string): Promise<any> => {
    this.d("Trying to update inline comment:" + commentId + " message:" + comment)
    return this.api.updateComment(commentId, comment)
  }

  deleteInlineComment = async (commentId: string): Promise<boolean> => {
    this.d("Trying to delete inline comment: " + commentId)

    await this.api.deleteComment(commentId)
    return true
  }

  updateStatus = async (
    passed: boolean | "pending",
    message: string,
    url?: string,
    dangerID?: string,
    ciCommitHash?: string
  ): Promise<boolean> => {
    const pr = await this.api.getPullRequestInfo()
    const commitId = ciCommitHash || pr.source.commit.hash

    let state: "SUCCESSFUL" | "INPROGRESS" | "FAILED" = passed ? "SUCCESSFUL" : "FAILED"
    if (passed === "pending") {
      state = "INPROGRESS" as const
    }

    let name = "Danger"
    let key = "danger.systems"
    if (process.env["PERIL_INTEGRATION_ID"]) {
      name = "Peril"
    } else if (dangerID) {
      name = dangerID
      key = dangerID
    }

    try {
      await this.api.postBuildStatus(commitId, {
        state,
        key: key,
        name: name,
        url: url || "http://danger.systems/js",
        description: message,
      })
      return true
    } catch (error) {
      return false
    }
  }

  getFileContents = this.api.getFileContents
}

export const bitbucketCloudJSONToBitBucketCloudDSL = (
  bitbucket: BitBucketCloudJSONDSL,
  api: BitBucketCloudAPI
): BitBucketCloudDSL => ({
  ...bitbucket,
  api,
})
