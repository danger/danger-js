import GitLabAPI from "./gitlab/GitLabAPI"
import { Comment, Platform } from "./platform"
import { GitDSL, GitJSONDSL } from "../dsl/GitDSL"
import { GitCommit } from "../dsl/Commit"
import { GitLabDiscussion, GitLabDSL, GitLabJSONDSL, GitLabNote } from "../dsl/GitLabDSL"
import { debug } from "../debug"
import { dangerIDToString } from "../runner/templates/githubIssueTemplate"

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
    const changes = await this.api.getMergeRequestChanges()
    const commits = await this.api.getMergeRequestCommits()

    const mappedCommits: GitCommit[] = commits.map((commit) => {
      return {
        sha: commit.id,
        author: {
          name: commit.author_name,
          email: commit.author_email as string,
          date: (commit.authored_date as Date).toString(),
        },
        committer: {
          name: commit.committer_name as string,
          email: commit.committer_email as string,
          date: (commit.committed_date as Date).toString(),
        },
        message: commit.message,
        parents: commit.parent_ids as string[],
        url: `${this.api.projectURL}/commit/${commit.id}`,
        tree: null,
      }
    })

    // XXX: does "renamed_file"/move count is "delete/create", or "modified"?
    const modified_files: string[] = changes
      .filter((change) => !change.new_file && !change.deleted_file)
      .map((change) => change.new_path)
    const created_files: string[] = changes.filter((change) => change.new_file).map((change) => change.new_path)
    const deleted_files: string[] = changes.filter((change) => change.deleted_file).map((change) => change.new_path)

    return {
      modified_files,
      created_files,
      deleted_files,
      commits: mappedCommits,
    }
  }

  getInlineComments = async (dangerID: string): Promise<Comment[]> => {
    const dangerUserID = (await this.api.getUser()).id

    return (await this.api.getMergeRequestInlineNotes()).map((note) => {
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
      const firstDiscussion = discussions.shift()
      const existingNote = firstDiscussion?.notes[0]
      // Delete all notes from all other danger discussions (discussions cannot be deleted as a whole):
      await this.deleteNotes(this.reduceNotesFromDiscussions(discussions)) //delete the rest

      let newOrUpdatedNote: GitLabNote

      if (existingNote) {
        // update the existing comment
        newOrUpdatedNote = await this.api.updateMergeRequestNote(existingNote.id, newComment)
      } else {
        // create a new comment
        newOrUpdatedNote = await this.createComment(dangerID, newComment)
      }

      // create URL from note
      // "https://gitlab.com/group/project/merge_requests/154#note_132143425"
      return `${this.api.mergeRequestURL}#note_${newOrUpdatedNote.id}`
    } else {
      const notes: GitLabNote[] = await this.getMainDangerNotes(dangerID)

      let note: GitLabNote

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

  createComment = async (_dangerID: string, comment: string): Promise<GitLabNote> => {
    d("createComment", { comment })
    if (useThreads()) {
      return (await this.api.createMergeRequestDiscussion(comment)).notes[0]
    }
    return this.api.createMergeRequestNote(comment)
  }

  createInlineComment = async (git: GitDSL, comment: string, path: string, line: number): Promise<GitLabDiscussion> => {
    d("createInlineComment", { git, comment, path, line })

    const mr = await this.api.getMergeRequestInfo()

    return this.api.createMergeRequestDiscussion(comment, {
      position: {
        position_type: "text",
        base_sha: mr.diff_refs.base_sha,
        start_sha: mr.diff_refs.start_sha,
        head_sha: mr.diff_refs.head_sha,
        old_path: path,
        old_line: null,
        new_path: path,
        new_line: line,
      },
    })
  }

  updateInlineComment = async (comment: string, id: string): Promise<GitLabNote> => {
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
      // There is no API to delete entire discussion. They can only be deleted fully by deleting every note:
      const discussions = await this.getDangerDiscussions(dangerID)
      return await this.deleteNotes(this.reduceNotesFromDiscussions(discussions))
    } else {
      const notes = await this.getMainDangerNotes(dangerID)
      for (let note of notes) {
        d("deleteMainComment", { id: note.id })
        await this.api.deleteMergeRequestNote(note.id)
      }

      return notes.length > 0
    }
  }

  deleteNotes = async (notes: GitLabNote[]): Promise<boolean> => {
    for (const note of notes) {
      d("deleteNotes", { id: note.id })
      await this.api.deleteMergeRequestNote(note.id)
    }

    return notes.length > 0
  }

  /**
   * Only fetches the discussions where danger owns the top note
   */
  getDangerDiscussions = async (dangerID: string): Promise<GitLabDiscussion[]> => {
    const noteFilter = await this.getDangerDiscussionNoteFilter(dangerID)
    const discussions: GitLabDiscussion[] = await this.api.getMergeRequestDiscussions()
    return discussions.filter(({ notes }) => notes.length && noteFilter(notes[0]))
  }

  reduceNotesFromDiscussions = (discussions: GitLabDiscussion[]): GitLabNote[] => {
    return discussions.reduce<GitLabNote[]>((acc, { notes }) => [...acc, ...notes], [])
  }

  /**
   * Attempts to find the "main" Danger note and should return at most
   * one item. If the "main" Danger note has any comments on it then that
   * note will not be returned.
   */
  getMainDangerNotes = async (dangerID: string): Promise<GitLabNote[]> => {
    const noteFilter = await this.getDangerMainNoteFilter(dangerID)
    const notes: GitLabNote[] = await this.api.getMergeRequestNotes()
    return notes.filter(noteFilter)
  }

  /**
   * Filters a note to determine if it was created by Danger.
   */
  getDangerDiscussionNoteFilter = async (dangerID: string): Promise<(note: GitLabNote) => boolean> => {
    const { id: dangerUserId } = await this.api.getUser()
    return ({ author: { id }, body, system }: GitLabNote): boolean => {
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
  getDangerMainNoteFilter = async (dangerID: string): Promise<(note: GitLabNote) => boolean> => {
    const { id: dangerUserId } = await this.api.getUser()
    return ({ author: { id }, body, system, type }: GitLabNote): boolean => {
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
  },
  api: api.apiInstance,
})
