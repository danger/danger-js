import { GitJSONDSL } from "../dsl/GitDSL"
import { BitBucketServerPRDSL, BitBucketServerJSONDSL } from "../dsl/BitBucketServerDSL"
import { BitBucketServerAPI } from "./bitbucket_server/BitBucketServerAPI"
import gitDSLForBitBucketServer from "./bitbucket_server/BitBucketServerGit"
import { Platform } from "./platform"

/** Handles conforming to the Platform Interface for BitBucketServer, API work is handle by BitBucketServerAPI */

export class BitBucketServer implements Platform {
  name: string

  constructor(public readonly api: BitBucketServerAPI) {
    this.name = "BitBucketServer"
  }

  /**
   * Get the Code Review description metadata
   *
   * @returns {Promise<any>} JSON representation
   */
  getReviewInfo = (): Promise<BitBucketServerPRDSL> => this.api.getPullRequestInfo()

  /**
   * Get the Code Review diff representation
   *
   * @returns {Promise<GitDSL>} the git DSL
   */
  getPlatformGitRepresentation = (): Promise<GitJSONDSL> => gitDSLForBitBucketServer(this.api)

  /**
   * Fails the current build, if status setting succeeds
   * then return true.
   */

  updateStatus = async (passed: boolean, message: string, url?: string): Promise<boolean> => {
    const pr = await this.api.getPullRequestInfo()
    const { latestCommit } = pr.fromRef
    try {
      await this.api.postBuildStatus(latestCommit, {
        state: passed ? "SUCCESSFUL" : "FAILED",
        key: "danger.systems",
        name: process.env["PERIL_INTEGRATION_ID"] ? "Peril" : "Danger",
        url: url || "http://danger.systems/js",
        description: message,
      })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Returns the `bitBucket_server` object on the Danger DSL
   *
   * @returns {Promise<BitBucketServerDSL>} JSON response of the DSL
   */
  getPlatformDSLRepresentation = async (): Promise<BitBucketServerJSONDSL> => {
    let pr: BitBucketServerPRDSL
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
    const issues = await this.api.getIssues()

    return {
      pr,
      commits,
      comments,
      activities,
      issues,
    }
  }

  supportsCommenting() {
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
    const comments = await this.api.getDangerComments(dangerID)
    for (let comment of comments) {
      await this.api.deleteComment(comment)
    }

    return comments.length > 0
  }

  /**
   * Either updates an existing comment, or makes a new one
   *
   * @param {string} newComment string value of comment
   * @returns {Promise<boolean>} success of posting comment
   */
  async updateOrCreateComment(dangerID: string, newComment: string): Promise<boolean> {
    const comments = await this.api.getDangerComments(dangerID)

    if (comments.length) {
      // Edit the first comment
      await this.api.updateComment(comments[0], newComment)

      // Delete any dupes
      for (let comment of comments) {
        if (comment !== comments[0]) {
          await this.api.deleteComment(comment)
        }
      }
    } else {
      await this.createComment(newComment)
    }

    return true
  }

  getFileContents = this.api.getFileContents
}
