import { GitJSONDSL, GitDSL } from "../dsl/GitDSL"
import { BitBucketServerPRDSL, BitBucketServerJSONDSL } from "../dsl/BitBucketServerDSL"
import { BitBucketServerAPI } from "./bitbucket_server/BitBucketServerAPI"
import gitDSLForBitBucketServer from "./bitbucket_server/BitBucketServerGit"
import { Platform, Comment } from "./platform"

import { debug } from "../debug"

/** Handles conforming to the Platform Interface for BitBucketServer, API work is handle by BitBucketServerAPI */

export class BitBucketServer implements Platform {
  private readonly d = debug("BitBucketServer")
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
   * Gets inline comments for current PR
   */
  getInlineComments = async (dangerID: string): Promise<Comment[]> => this.api.getDangerInlineComments(dangerID)

  /**
   * Fails the current build, if status setting succeeds
   * then return true.
   */
  updateStatus = async (
    passed: boolean | "pending",
    message: string,
    url?: string,
    dangerID?: string
  ): Promise<boolean> => {
    const pr = await this.api.getPullRequestInfo()
    const { latestCommit } = pr.fromRef

    let state = passed ? "SUCCESSFUL" : "FAILED"
    if (passed === "pending") {
      state = "INPROGRESS"
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
      await this.api.postBuildStatus(latestCommit, {
        state: state,
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

  /**
   * Returns the `bitBucket_server` object on the Danger DSL
   *
   * @returns {Promise<BitBucketServerDSL>} JSON response of the DSL
   */
  getPlatformReviewDSLRepresentation = async (): Promise<BitBucketServerJSONDSL> => {
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
      metadata: this.api.repoMetadata,
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
   * Makes an inline comment if possible. If platform can't make an inline comment with given arguments,
   * it returns a promise rejection. (e.g. platform doesn't support inline comments or line was out of diff).
   *
   * @returns {Promise<any>} JSON response of new comment
   */
  createInlineComment = (git: GitDSL, comment: string, path: string, line: number): Promise<any> => {
    if (!this.supportsInlineComments) {
      return new Promise((_resolve, reject) => reject())
    }
    return this.findTypeOfLine(git, line, path).then(type => {
      return this.api.postInlinePRComment(comment, line, type, path)
    })
  }

  /**
   * Finds type of line in given diff. This is needed for Bitbucket Server API
   *
   * @returns {Promise<string>} A string with type of line
   */
  findTypeOfLine = (git: GitDSL, line: number, path: string): Promise<string> => {
    return git.structuredDiffForFile(path).then(diff => {
      return new Promise<string>((resolve, reject) => {
        if (diff === undefined) {
          this.d("Diff not found for inline comment." + path + "#" + line + ". Diff: " + JSON.stringify(diff))
          reject()
        }
        let change
        for (let chunk of diff!.chunks) {
          // Search for a change (that is not a deletion) and with given line. We want to look only for destination lines of a change
          change = chunk.changes.find((c: any) => c.type != "del" && c.destinationLine == line)
          break
        }
        if (change === undefined) {
          this.d("change not found for inline comment line " + path + "#" + line + ".")
          reject()
        } else {
          resolve(change.type)
        }
      })
    })
  }

  /**
   * Updates an inline comment if possible. If platform can't update an inline comment,
   * it returns a promise rejection. (e.g. platform doesn't support inline comments or line was out of diff).
   *
   * @returns {Promise<any>} JSON response of new comment
   */
  updateInlineComment = async (comment: string, commentId: string): Promise<any> => {
    if (!this.supportsInlineComments) {
      return new Promise((_resolve, reject) => reject())
    }
    const activities = await this.api.getPullRequestComments()
    const updateComment = activities
      .filter(activity => activity.commentAnchor)
      .map(activity => activity.comment)
      .filter(Boolean)
      .find(comment => comment!.id.toString() == commentId)

    return this.api.updateComment(updateComment!, comment)
  }

  /**
   * Deletes an inline comment, used when you have
   * fixed all your failures.
   *
   * @returns {Promise<boolean>} did it work?
   */
  deleteInlineComment = async (id: string): Promise<any> => {
    if (!this.supportsInlineComments) {
      return new Promise<boolean>((_resolve, reject) => reject())
    }
    const activities = await this.api.getPullRequestComments()
    const deleteComment = activities
      .filter(activity => activity.commentAnchor)
      .map(activity => activity.comment)
      .filter(Boolean)
      .find(comment => comment!.id.toString() == id)

    return this.api.deleteComment(deleteComment!)
  }

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
   * @param {string} dangerID the UUID for the run
   * @param {string} newComment string value of comment
   * @returns {Promise<string>} the URL for the comment
   */
  async updateOrCreateComment(dangerID: string, newComment: string): Promise<string | undefined> {
    const comments = await this.api.getDangerComments(dangerID)
    let issue = null

    if (comments.length) {
      // Edit the first comment
      issue = await this.api.updateComment(comments[0], newComment)

      // Delete any dupes
      for (let comment of comments) {
        if (comment !== comments[0]) {
          await this.api.deleteComment(comment)
        }
      }
    } else {
      issue = await this.createComment(newComment)
    }

    // We want to make a URL like:
    // https://bitbucket.org/atlassian/jiraconnect-ios/pull-requests/4/crash-groups/diff#comment-426
    // So take the PR and attack the comment, I think :D

    const host = this.api.repoCredentials.host
    const { repoSlug, pullRequestID } = this.api.repoMetadata
    return issue && issue.id && `${host}/${repoSlug}/pull-requests/${pullRequestID}/overview?commentId=${issue.id}`
  }

  getFileContents = this.api.getFileContents
}
