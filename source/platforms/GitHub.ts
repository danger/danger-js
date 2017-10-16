import { GitJSONDSL } from "../dsl/GitDSL"
import { GitHubPRDSL, GitHubDSL, GitHubIssue, GitHubAPIPR, GitHubJSONDSL } from "../dsl/GitHubDSL"
import { GitHubAPI } from "./github/GitHubAPI"
import GitHubUtils from "./github/GitHubUtils"
import gitDSLForGitHub from "./github/GitHubGit"

import * as NodeGitHub from "github"

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
  async getPlatformGitRepresentation(): Promise<GitJSONDSL> {
    return gitDSLForGitHub(this.api)
  }

  /**
   * Gets issue specific metadata for a PR
   */

  async getIssue(): Promise<GitHubIssue> {
    const issue = await this.api.getIssue()
    return issue || { labels: [] }
  }

  /**
   * Fails the current build, if status setting succeeds
   * then return true.
   */

  async updateStatus(passed: boolean, message: string): Promise<boolean> {
    return await this.api.updateStatus(passed, message)
  }

  /**
   * Returns the `github` object on the Danger DSL
   *
   * @returns {Promise<GitHubDSL>} JSON response of the DSL
   */
  async getPlatformDSLRepresentation(): Promise<GitHubJSONDSL> {
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

    // const externalAPI = this.api.getExternalAPI()
    const thisPR = this.APIMetadataForPR(pr)
    return {
      // api: externalAPI,
      issue,
      pr,
      commits,
      reviews,
      requested_reviewers,
      thisPR,
      // utils: GitHubUtils(pr, this.api),
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
    const commentIDs = await this.api.getDangerCommentIDs()
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
  async updateOrCreateComment(newComment: string): Promise<boolean> {
    const commentIDs = await this.api.getDangerCommentIDs()

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
  APIMetadataForPR(pr: GitHubPRDSL): GitHubAPIPR {
    return {
      number: pr.number,
      repo: pr.head.repo.name,
      owner: pr.head.repo.owner.login,
    }
  }
}

// This class should get un-classed, but for now we can expand by functions

export const githubJSONToGitHubDSL = (gh: GitHubJSONDSL, api: NodeGitHub): GitHubDSL => {
  return {
    ...gh,
    api,
    utils: GitHubUtils(gh.pr, api),
  }
}
