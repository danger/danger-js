import { GitDSL } from "../dsl/GitDSL"
import { GitHubPRDSL, GitHubDSL, GitHubIssue, GitHubIssueLabel } from "../dsl/GitHubDSL"
import { GitHubAPI } from "./github/GitHubAPI"
import GitHubUtils from "./github/GitHubUtils"
import gitDSLForGitHub from "./github/GitHubGit"

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
  async getPlatformGitRepresentation(): Promise<GitDSL> {
    return gitDSLForGitHub(this.api)
  }

  /**
   * Gets issue specific metadata for a PR
   *
   * TODO: Convert from a mapped type, to one with a public interface in the DSL
   * that shows the useful stuff, but still allows others to dig into the data structure
   *
   */

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
    const externalAPI = this.api.getExternalAPI()

    return {
      api: externalAPI,
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
