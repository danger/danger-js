import { GitJSONDSL } from "../dsl/GitDSL"
import { GitHubPRDSL, GitHubDSL, GitHubIssue, GitHubAPIPR, GitHubJSONDSL } from "../dsl/GitHubDSL"
import { GitHubAPI } from "./github/GitHubAPI"
import GitHubUtils from "./github/GitHubUtils"
import gitDSLForGitHub from "./github/GitHubGit"

import * as NodeGitHub from "@octokit/rest"

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
  getReviewInfo = (): Promise<GitHubPRDSL> => this.api.getPullRequestInfo()

  /**
   * Get the Code Review diff representation
   *
   * @returns {Promise<GitDSL>} the git DSL
   */
  getPlatformGitRepresentation = (): Promise<GitJSONDSL> => gitDSLForGitHub(this.api)

  /**
   * Gets issue specific metadata for a PR
   */

  getIssue = async (): Promise<GitHubIssue> => {
    const issue = await this.api.getIssue()
    return issue || { labels: [] }
  }

  /**
   * Fails the current build, if status setting succeeds
   * then return true.
   */

  updateStatus = async (passed: boolean, message: string, url?: string): Promise<boolean> => {
    const ghAPI = this.api.getExternalAPI()

    const prJSON = await this.api.getPullRequestInfo()
    const ref = prJSON.head
    try {
      await ghAPI.repos.createStatus({
        repo: ref.repo.name,
        owner: ref.repo.owner.login,
        sha: ref.sha,
        state: passed ? "success" : "failure",
        context: process.env["PERIL_INTEGRATION_ID"] ? "Peril" : "Danger",
        target_url: url || "http://danger.systems/js",
        description: message,
      })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Returns the `github` object on the Danger DSL
   *
   * @returns {Promise<GitHubDSL>} JSON response of the DSL
   */
  getPlatformDSLRepresentation = async (): Promise<GitHubJSONDSL> => {
    const pr = await this.getReviewInfo()
    if ((pr as any) === {}) {
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

    const thisPR = this.APIMetadataForPR(pr)
    return {
      issue,
      pr,
      commits,
      reviews,
      requested_reviewers,
      thisPR,
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

  // In Danger RB we support a danger_id property,
  // this should be handled at some point

  /**
   * Deletes the main Danger comment, used when you have
   * fixed all your failures.
   *
   * @returns {Promise<boolean>} did it work?
   */
  deleteMainComment = async (dangerID: string): Promise<boolean> => {
    const commentIDs = await this.api.getDangerCommentIDs(dangerID)
    for (let commentID of commentIDs) {
      await this.api.deleteCommentWithID(commentID)
    }

    return commentIDs.length > 0
  }

  /**
   * Either updates an existing comment, or makes a new one
   *
   * @param {string} newComment string value of comment
   * @returns {Promise<boolean>} success of posting comment
   */
  async updateOrCreateComment(dangerID: string, newComment: string): Promise<boolean> {
    const commentIDs = await this.api.getDangerCommentIDs(dangerID)

    if (commentIDs.length) {
      // Edit the first comment
      await this.api.updateCommentWithID(commentIDs[0], newComment)

      // Delete any dupes
      for (let commentID of commentIDs) {
        if (commentID !== commentIDs[0]) {
          await this.api.deleteCommentWithID(commentID)
        }
      }
    } else {
      await this.createComment(newComment)
    }

    return true
  }

  /**
   * Converts the PR JSON into something easily used by the Github API client.
   */
  APIMetadataForPR = (pr: GitHubPRDSL): GitHubAPIPR => {
    return {
      number: pr.number,
      repo: pr.base.repo.name,
      owner: pr.base.repo.owner.login,
    }
  }

  getFileContents = this.api.fileContents
}

// This class should get un-classed, but for now we can expand by functions

export const githubJSONToGitHubDSL = (gh: GitHubJSONDSL, api: NodeGitHub): GitHubDSL => {
  return {
    ...gh,
    api,
    utils: GitHubUtils(gh.pr, api),
  }
}
