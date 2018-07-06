import { GitDSL } from "../../../dsl/GitDSL"
import { GitHubAPI } from "../GitHubAPI"
import { debug } from "../../../debug"
import { Comment } from "../../platform"

const d = debug("GitHub::Issue")

/**
 * Finds a position in given diff. This is needed for GitHub API, more on the position finder
 * can be found here: https://developer.github.com/v3/pulls/comments/#create-a-comment
 *
 * @returns {Promise<number>} A number with given position
 */
export const findPositionForInlineComment = (git: GitDSL, line: number, path: string): Promise<number> => {
  d("Finding position for inline comment." + path + "#" + line)
  return git.structuredDiffForFile(path).then(diff => {
    return new Promise<number>((resolve, reject) => {
      if (diff === undefined) {
        d("Diff not found for inline comment." + path + "#" + line + ". Diff: " + JSON.stringify(diff))
        reject()
      }

      d(
        "Diff found for inline comment, now getting a position." + path + "#" + line + ". Diff: " + JSON.stringify(diff)
      )
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
      d("Position found for inline comment: " + fileLine + "." + path + "#" + line)
      resolve(fileLine)
    })
  })
}

/**
 * An object whose responsibility is to handle commenting on an issue
 * @param api
 */
export const GitHubIssueCommenter = (api: GitHubAPI) => {
  const d = debug("GitHub::Issue")

  return {
    supportsCommenting: () => true,
    supportsInlineComments: () => true,
    /**
     * Fails the current build, if status setting succeeds
     * then return true.
     */

    updateStatus: async (passed: boolean | "pending", message: string, url?: string): Promise<boolean> => {
      const ghAPI = api.getExternalAPI()

      const prJSON = await api.getPullRequestInfo()
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
        // @ts-ignore
        if (global.verbose) {
          console.log("Got an error with creating a commit status", error)
        }
        return false
      }
    },

    /**
     * Gets inline comments for current PR
     */
    getInlineComments: async (dangerID: string): Promise<Comment[]> => api.getPullRequestInlineComments(dangerID),

    /**
     * Returns the response for the new comment
     *
     * @param {string} comment you want to post
     * @returns {Promise<any>} JSON response of new comment
     */
    createComment: (comment: string) => api.postPRComment(comment),

    /**
     * Makes an inline comment if possible. If platform can't make an inline comment with given arguments,
     * it returns a promise rejection. (e.g. platform doesn't support inline comments or line was out of diff).
     *
     * @returns {Promise<any>} JSON response of new comment
     */
    createInlineComment: (git: GitDSL, comment: string, path: string, line: number): Promise<any> => {
      let commitId = git.commits[git.commits.length - 1].sha
      d("Creating inline comment. Commit: " + commitId)
      return findPositionForInlineComment(git, line, path).then(position => {
        return api.postInlinePRComment(comment, commitId, path, position)
      })
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
  }
}
