import { GitJSONDSL, GitDSL } from "../dsl/GitDSL"
import { GitHubPRDSL, GitHubDSL, GitHubIssue, GitHubAPIPR, GitHubJSONDSL } from "../dsl/GitHubDSL"
import { GitHubAPI } from "./github/GitHubAPI"
import GitHubUtils from "./github/GitHubUtils"
import gitDSLForGitHub from "./github/GitHubGit"

import * as NodeGitHub from "@octokit/rest"
import { Platform, Comment } from "./platform"

/** Handles conforming to the Platform Interface for GitHub, API work is handle by GitHubAPI */

export class GitHub implements Platform {
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
   * Gets inline comments for current PR
   */
  getInlineComments = async (): Promise<Comment[]> => this.api.getPullRequestInlineComments()

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
    let pr: GitHubPRDSL
    try {
      pr = await this.getReviewInfo()
    } catch {
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

    let commitId = git.commits[git.commits.length - 1].sha

    return this.findPositionForInlineComment(git, line, path).then(position => {
      return this.api.postInlinePRComment(comment, commitId, path, position)
    })
  }

  /**
   * Updates an inline comment if possible. If platform can't update an inline comment,
   * it returns a promise rejection. (e.g. platform doesn't support inline comments or line was out of diff).
   *
   * @returns {Promise<any>} JSON response of new comment
   */
  updateInlineComment = (comment: string, commentId: string): Promise<any> => {
    if (!this.supportsInlineComments) {
      return new Promise((_resolve, reject) => reject())
    }

    return this.api.updateInlinePRComment(comment, commentId)
  }

  /**
   * Finds a position in given diff. This is needed for GitHub API, more on the position finder
   * can be found here: https://developer.github.com/v3/pulls/comments/#create-a-comment
   *
   * @returns {Promise<number>} A number with given position
   */
  findPositionForInlineComment = (git: GitDSL, line: number, path: string): Promise<number> => {
    return git.diffForFile(path).then(diff => {
      return new Promise<number>((resolve, reject) => {
        if (diff === undefined) {
          reject()
        }

        let fileLine = 0
        for (let chunk of diff!.chunks) {
          // Search for a change (that is not a deletion). "ln" is for normal changes, "ln2" for additions,
          // thus need to check for either of them
          let index = chunk.changes.findIndex((c: any) => c.type != "del" && (c.ln == line || c.ln2 == line))
          if (index != -1) {
            fileLine += index + 1
            break
          } else {
            fileLine += chunk.changes.length + 1
          }
        }

        resolve(fileLine)
      })
    })
  }

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
   * Deletes an inline comment, used when you have
   * fixed all your failures.
   *
   * @returns {Promise<boolean>} did it work?
   */
  deleteInlineComment = async (id: number): Promise<boolean> => this.api.deleteInlineCommentWithID(id)

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
