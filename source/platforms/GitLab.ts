import GitLabAPI from "./gitlab/GitLabAPI"
import { inlinePositionParser } from "./gitlab/inlinePositionParser"
import { Comment, Platform } from "./platform"
import { GitDSL, GitJSONDSL } from "../dsl/GitDSL"
import { GitCommit } from "../dsl/Commit"
import { GitLabDSL, GitLabJSONDSL } from "../dsl/GitLabDSL"
import { debug } from "../debug"
import { dangerIDToString } from "../runner/templates/githubIssueTemplate"
import type * as Types from "@gitbeaker/rest"

const d = debug("GitLab")

/**
 * Determines whether Danger should use threads for the "main" Danger comment.
 */
const useThreads = () =>
  process.env.DANGER_GITLAB_USE_THREADS === "1" || process.env.DANGER_GITLAB_USE_THREADS === "true"

class GitLab implements Platform {
  public readonly name: string

  constructor(public readonly api: GitLabAPI) {
    this.name = "GitLab"
  }

  getReviewInfo = async (): Promise<any> => {
    return this.api.getMergeRequestInfo()
  }

  // returns the `danger.gitlab` object
  getPlatformReviewDSLRepresentation = async (): Promise<GitLabJSONDSL> => {
    const mr = await this.getReviewInfo()
    const commits = await this.api.getMergeRequestCommits()
    const approvals = await this.api.getMergeRequestApprovals()
    return {
      metadata: this.api.repoMetadata,
      mr,
      commits,
      approvals,
    }
  }
  // TODO: test
  getPlatformGitRepresentation = async (): Promise<GitJSONDSL> => {
    const diffs = await this.api.getMergeRequestDiffs()
    const commits = await this.api.getMergeRequestCommits()

    const mappedCommits: GitCommit[] = commits.map((commit) => {
      return {
        sha: commit.id,
        author: {
          name: commit.author_name,
          email: commit.author_email as string,
          date: commit.authored_date as string,
        },
        committer: {
          name: commit.committer_name as string,
          email: commit.committer_email as string,
          date: commit.committed_date as string,
        },
        message: commit.message,
        parents: commit.parent_ids as string[],
        url: `${this.api.projectURL}/commit/${commit.id}`,
        tree: null,
      }
    })

    // XXX: does "renamed_file"/move count is "delete/create", or "modified"?
    const modified_files: string[] = diffs
      .filter((diff) => !diff.new_file && !diff.deleted_file)
      .map((diff) => diff.new_path)
    const created_files: string[] = diffs.filter((diff) => diff.new_file).map((diff) => diff.new_path)
    const deleted_files: string[] = diffs.filter((diff) => diff.deleted_file).map((diff) => diff.new_path)

    return {
      modified_files,
      created_files,
      deleted_files,
      commits: mappedCommits,
    }
  }

  getInlineComments = async (dangerID: string): Promise<Comment[]> => {
    d("getInlineComments", { dangerID })
    const dangerUserID = (await this.api.getUser()).id

    let dangerDiscussions = await this.getDangerDiscussions(dangerID)
    // Remove system resolved danger discussions to not end up deleting danger inline comments
    // on old versions of the diff. This is preferred as otherwise the discussion ends up in a state where
    // the auto resolve system note can become the first note on the discussion resulting in poor change history on the MR.
    dangerDiscussions = dangerDiscussions.filter((discussion) => !this.isDangerDiscussionSystemResolved(discussion))
    d("getInlineComments found danger discussions", dangerDiscussions)

    const diffNotes = this.getDiffNotesFromDiscussions(dangerDiscussions)
    return diffNotes.map((note) => {
      return {
        id: `${note.id}`,
        body: note.body,
        ownedByDanger: note.author.id === dangerUserID && note.body.includes(dangerID),
      }
    })
  }

  supportsCommenting() {
    return true
  }

  supportsInlineComments() {
    return true
  }

  updateOrCreateComment = async (dangerID: string, newComment: string): Promise<string> => {
    d("updateOrCreateComment", { dangerID, newComment })

    if (useThreads()) {
      const discussions = await this.getDangerDiscussions(dangerID)
      d("updateOrCreateComment using threads, discussions", discussions)
      const firstDiscussion = discussions.shift()
      const existingNote = firstDiscussion?.notes?.[0]
      await this.deleteDiscussions(discussions)

      let newOrUpdatedNote: Types.DiscussionNoteSchema | undefined

      if (existingNote) {
        // update the existing comment
        newOrUpdatedNote = await this.api.updateMergeRequestNote(existingNote.id, newComment)
      } else {
        // create a new comment
        newOrUpdatedNote = (await this.api.createMergeRequestDiscussion(newComment))?.notes?.[0]
      }

      if (!newOrUpdatedNote) {
        throw new Error("Could not update or create comment")
      }

      // create URL from note
      // "https://gitlab.com/group/project/merge_requests/154#note_132143425"
      return `${this.api.mergeRequestURL}#note_${newOrUpdatedNote.id}`
    } else {
      const notes = await this.getMainDangerNotes(dangerID)
      d("updateOrCreateComment not using threads, main danger notes", notes)

      let note: Types.MergeRequestNoteSchema

      if (notes.length) {
        // update the first
        note = await this.api.updateMergeRequestNote(notes[0].id, newComment)
        // delete the rest
        for (let deleteme of notes) {
          if (deleteme === notes[0]) {
            continue
          }
          await this.api.deleteMergeRequestNote(deleteme.id)
        }
      } else {
        // create a new note
        note = await this.api.createMergeRequestNote(newComment)
      }
      // create URL from note
      // "https://gitlab.com/group/project/merge_requests/154#note_132143425"
      return `${this.api.mergeRequestURL}#note_${note.id}`
    }
  }

  createComment = async (
    _dangerID: string,
    comment: string
  ): Promise<Types.DiscussionNoteSchema | Types.MergeRequestNoteSchema | undefined> => {
    d("createComment", { comment })
    if (useThreads()) {
      return (await this.api.createMergeRequestDiscussion(comment))?.notes?.[0]
    }
    return this.api.createMergeRequestNote(comment)
  }

  createInlineComment = async (
    git: GitDSL,
    comment: string,
    path: string,
    line: number
  ): Promise<Types.DiscussionSchema> => {
    d("createInlineComment", { git, comment, path, line })

    const structuredDiffForFile = await git.structuredDiffForFile(path)
    if (!structuredDiffForFile) {
      return Promise.reject(`Unable to find diff for file ${path}`)
    }

    const inlinePosition = inlinePositionParser(structuredDiffForFile, path, line)
    d("createInlineComment inlinePosition", inlinePosition)

    const mr = await this.api.getMergeRequestInfo()
    const position = {
      positionType: "text",
      baseSha: mr.diff_refs.base_sha,
      startSha: mr.diff_refs.start_sha,
      headSha: mr.diff_refs.head_sha,
      oldPath: inlinePosition.pathDiff.oldPath,
      newPath: inlinePosition.pathDiff.newPath,
      oldLine: inlinePosition.lineDiff.oldLine?.toString(),
      newLine: inlinePosition.lineDiff.newLine?.toString(),
    } as Types.Camelize<Types.DiscussionNotePositionTextSchema>

    return this.api.createMergeRequestDiscussion(comment, {
      position: position,
    })
  }

  updateInlineComment = async (comment: string, id: string): Promise<Types.MergeRequestNoteSchema> => {
    d("updateInlineComment", { comment, id })
    const nid = parseInt(id) // fingers crossed
    return await this.api.updateMergeRequestNote(nid, comment)
  }

  deleteInlineComment = async (id: string): Promise<boolean> => {
    d("deleteInlineComment", { id })
    const nid = parseInt(id) // fingers crossed
    return await this.api.deleteMergeRequestNote(nid)
  }

  /**
   * Attempts to delete the "main" Danger comment. If the "main" Danger
   * comment has any comments on it then that comment will not be deleted.
   */
  deleteMainComment = async (dangerID: string): Promise<boolean> => {
    if (useThreads()) {
      const discussions = await this.getDangerDiscussions(dangerID)
      return await this.deleteDiscussions(discussions)
    } else {
      const notes = await this.getMainDangerNotes(dangerID)
      for (let note of notes) {
        d("deleteMainComment", { id: note.id })
        await this.api.deleteMergeRequestNote(note.id)
      }

      return notes.length > 0
    }
  }

  deleteDiscussions = async (discussions: Types.DiscussionSchema[]): Promise<boolean> => {
    d("deleteDiscussions", { length: discussions.length })
    for (const discussion of discussions) {
      await this.deleteDiscussion(discussion)
    }

    return discussions.length > 0
  }

  deleteDiscussion = async (discussion: Types.DiscussionSchema): Promise<boolean> => {
    d("deleteDiscussion", { discussionId: discussion.id })
    // There is no API to delete entire discussion. They can only be deleted fully by deleting every note
    const discussionNotes = discussion.notes ?? []
    for (const discussionNote of discussionNotes) {
      await this.api.deleteMergeRequestNote(discussionNote.id)
    }

    return discussionNotes.length > 0
  }

  /**
   * Only fetches the discussions where danger owns the top note
   */
  getDangerDiscussions = async (dangerID: string): Promise<Types.DiscussionSchema[]> => {
    const noteFilter = await this.getDangerDiscussionNoteFilter(dangerID)
    const discussions = await this.api.getMergeRequestDiscussions()
    return discussions.filter(({ notes }) => notes && notes.length && noteFilter(notes[0]))
  }

  isDangerDiscussionSystemResolved = (discussion: Types.DiscussionSchema): boolean => {
    const notes = discussion.notes
    if (!notes) {
      return false
    }

    const dangerNote = notes[0]
    if (!dangerNote || !dangerNote.resolved) {
      return false
    }

    // Check for a system note that resolved it
    return notes.some((note) => {
      return note.system === true
    })
  }

  getDiffNotesFromDiscussions = (discussions: Types.DiscussionSchema[]): Types.DiscussionNoteSchema[] => {
    const diffNotes = discussions.map((discussion) => {
      const note = discussion.notes?.[0]
      if (!note || note.type != "DiffNote") {
        return undefined
      }
      return note
    })
    return diffNotes.filter(Boolean) as Types.DiscussionNoteSchema[]
  }

  /**
   * Attempts to find the "main" Danger note and should return at most
   * one item. If the "main" Danger note has any comments on it then that
   * note will not be returned.
   */
  getMainDangerNotes = async (dangerID: string): Promise<Types.MergeRequestNoteSchema[]> => {
    const noteFilter = await this.getDangerMainNoteFilter(dangerID)
    const notes = await this.api.getMergeRequestNotes()
    return notes.filter(noteFilter)
  }

  /**
   * Filters a note to determine if it was created by Danger.
   */
  getDangerDiscussionNoteFilter = async (dangerID: string): Promise<(note: Types.DiscussionNoteSchema) => boolean> => {
    const { id: dangerUserId } = await this.api.getUser()
    return ({ author: { id }, body, system }: Types.DiscussionNoteSchema): boolean => {
      return (
        !system && // system notes are generated when the user interacts with the UI e.g. changing a PR title
        id === dangerUserId &&
        body.includes(dangerIDToString(dangerID))
      )
    }
  }

  /**
   * Filters a note to the "main" Danger note. If that note has any
   * comments on it then it will not be found.
   */
  getDangerMainNoteFilter = async (dangerID: string): Promise<(note: Types.MergeRequestNoteSchema) => boolean> => {
    const { id: dangerUserId } = await this.api.getUser()
    return ({ author: { id }, body, system, type }): boolean => {
      return (
        !system && // system notes are generated when the user interacts with the UI e.g. changing a PR title
        id === dangerUserId &&
        // This check for the type being `null` seems to be the best option
        // we have to determine whether this note is the "main" Danger note.
        // This assumption does not hold if there are any comments on the
        // "main" Danger note and in that case a new "main" Danger note will
        // be created instead of updating the existing note. This behavior is better
        // than the current alternative which is the bug described here:
        // https://github.com/danger/danger-js/issues/1351
        type == null &&
        body.includes(dangerIDToString(dangerID))
      )
    }
  }

  updateStatus = async (): Promise<boolean> => {
    d("updateStatus", {})
    return true
  }

  getFileContents = this.api.getFileContents
}

export default GitLab

export const gitlabJSONToGitLabDSL = (gl: GitLabDSL, api: GitLabAPI): GitLabDSL => ({
  ...gl,
  utils: {
    fileContents: api.getFileContents,
    addLabels: api.addLabels,
    removeLabels: api.removeLabels,
    updateMergeRequestInfo: api.updateMergeRequestInfo,
  },
  api: api.apiInstance,
})
