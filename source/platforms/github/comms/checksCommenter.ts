import { GitDSL } from "../../../dsl/GitDSL"
import { GitHubAPI } from "../GitHubAPI"
import * as debug from "debug"
import { Comment, PlatformCommunicator } from "../../platform"

// See https://github.com/auth0/node-jsonwebtoken/issues/162
const JWT_REGEX = /^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/

const d = debug("danger:GitHub::Checks")

export const getCheckAuthFromEnv = () => {
  const appID = process.env.DANGER_GITHUB_APP_ID || process.env.PERIL_INTEGRATION_ID
  const key = process.env.DANGER_GITHUB_APP_PRIVATE_SIGNING_KEY || process.env.PRIVATE_GITHUB_SIGNING_KEY
  const installID = process.env.DANGER_GITHUB_APP_INSTALL_ID || process.env.PERIL_ORG_INSTALLATION_ID

  return {
    appID,
    key,
    installID,
  }
}

const canUseChecks = (token: string | undefined) => {
  // Is it a JWT from Peril, basically?
  if (token && token.match(JWT_REGEX)) {
    return true
  } else {
    const auth = getCheckAuthFromEnv()
    return auth.appID && auth.key && auth.installID
  }
}

/**
 * An object whose responsibility is to handle commenting on an issue
 * @param api
 */
export const GitHubChecksCommenter = (api: GitHubAPI): PlatformCommunicator | undefined => {
  if (!canUseChecks(api.token)) {
    return undefined
  }

  return {
    supportsCommenting: () => true,
    supportsInlineComments: () => true,
    supportsHandlingResultsManually: () => true,
    /**
     * Fails the current build, if status setting succeeds
     * then return true.
     */

    updateStatus: async (passed: boolean | "pending", message: string, url?: string): Promise<boolean> => {
      return true
      // const ghAPI = api.getExternalAPI()

      // const prJSON = await api.getPullRequestInfo()
      // const ref = prJSON.head
      // try {
      //   await ghAPI.repos.createStatus({
      //     repo: ref.repo.name,
      //     owner: ref.repo.owner.login,
      //     sha: ref.sha,
      //     state: passed ? "success" : "failure",
      //     context: process.env["PERIL_INTEGRATION_ID"] ? "Peril" : "Danger",
      //     target_url: url || "http://danger.systems/js",
      //     description: message,
      //   })
      //   return true
      // } catch (error) {
      //   return false
      // }
      // await ghAPI.checks.
    },

    /**
     * Gets inline comments for current PR
     */
    getInlineComments: async (dangerID: string): Promise<Comment[]> => Promise.resolve([]),

    /**
     * Returns the response for the new comment
     *
     * @param {string} comment you want to post
     * @returns {Promise<any>} JSON response of new comment
     */
    createComment: (comment: string) => Promise.resolve({}),

    /**
     * Makes an inline comment if possible. If platform can't make an inline comment with given arguments,
     * it returns a promise rejection. (e.g. platform doesn't support inline comments or line was out of diff).
     *
     * @returns {Promise<any>} JSON response of new comment
     */
    createInlineComment: (git: GitDSL, comment: string, path: string, line: number): Promise<any> => {
      return Promise.resolve({})
    },

    /**
     * Updates an inline comment if possible. If platform can't update an inline comment,
     * it returns a promise rejection. (e.g. platform doesn't support inline comments or line was out of diff).
     *
     * @returns {Promise<any>} JSON response of new comment
     */
    updateInlineComment: (comment: string, commentId: string): Promise<any> => {
      d("Updating inline comment. CommentId: " + commentId + "comment: " + comment)
      return api.updateInlinePRComment(comment, commentId)
    },

    /**
     * Deletes the main Danger comment, used when you have
     * fixed all your failures.
     *
     * @returns {Promise<boolean>} did it work?
     */
    deleteMainComment: async (dangerID: string): Promise<boolean> => {
      const commentIDs = await api.getDangerCommentIDs(dangerID)
      for (let commentID of commentIDs) {
        d(`Deleting comment ${commentID}`)
        await api.deleteCommentWithID(commentID)
      }

      return commentIDs.length > 0
    },

    /**
     * Deletes an inline comment, used when you have
     * fixed all your failures.
     *
     * @returns {Promise<boolean>} did it work?
     */
    deleteInlineComment: async (id: string): Promise<boolean> => api.deleteInlineCommentWithID(id),

    /**
     * Either updates an existing comment, or makes a new one
     *
     * @param {string} newComment string value of comment
     * @returns {Promise<boolean>} success of posting comment
     */
    updateOrCreateComment: async (dangerID: string, newComment: string): Promise<string | undefined> => {
      const commentIDs = await api.getDangerCommentIDs(dangerID)
      let issue = null

      if (commentIDs.length) {
        // Edit the first comment
        d(`Updating comment ${commentIDs[0]}`)
        issue = await api.updateCommentWithID(commentIDs[0], newComment)

        // Delete any dupes
        for (let commentID of commentIDs) {
          if (commentID !== commentIDs[0]) {
            d(`Deleting comment ${commentID}`)
            await api.deleteCommentWithID(commentID)
          }
        }
      } else {
        d(`Creating new comment`)
        issue = await api.postPRComment(newComment)
      }

      return issue && issue.html_url
    },
    findPositionForInlineComment: () => 1,
  }
}
