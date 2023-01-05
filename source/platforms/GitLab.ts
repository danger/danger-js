import GitLabAPI from "./gitlab/GitLabAPI"
import { Comment, Platform } from "./platform"
import { GitDSL, GitJSONDSL } from "../dsl/GitDSL"
import { GitCommit } from "../dsl/Commit"
import { GitLabDiscussion, GitLabDSL, GitLabJSONDSL, GitLabNote } from "../dsl/GitLabDSL"
import { debug } from "../debug"
import { dangerIDToString } from "../runner/templates/githubIssueTemplate"

const d = debug("GitLab")

const useThreads = () => process.env.DANGER_GITLAB_USE_THREADS === "1" ||
  process.env.DANGER_GITLAB_USE_THREADS === "true"

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

  getPlatformGitRepresentation = async (): Promise<GitJSONDSL> => {
    const changes = await this.api.getMergeRequestChanges()
    const commits = await this.api.getMergeRequestCommits()

    const mappedCommits: GitCommit[] = commits.map(commit => {
      return {
        sha: commit.id,
        author: {
          name: commit.author_name,
          email: commit.author_email,
          date: commit.authored_date,
        },
        committer: {
          name: commit.committer_name,
          email: commit.committer_email,
          date: commit.committed_date,
        },
        message: commit.message,
        parents: commit.parent_ids,
        url: `${this.api.projectURL}/commit/${commit.id}`,
        tree: null,
      }
    })

    // XXX: does "renamed_file"/move count is "delete/create", or "modified"?
    const modified_files: string[] = changes
      .filter(change => !change.new_file && !change.deleted_file)
      .map(change => change.new_path)
    const created_files: string[] = changes.filter(change => change.new_file).map(change => change.new_path)
    const deleted_files: string[] = changes.filter(change => change.deleted_file).map(change => change.new_path)

    return {
      modified_files,
      created_files,
      deleted_files,
      commits: mappedCommits,
    }
  }

  getInlineComments = async (dangerID: string): Promise<Comment[]> => {
    const dangerUserID = (await this.api.getUser()).id

    return (await this.api.getMergeRequestInlineNotes()).map(note => {
      return {
        id: `${note.id}`,
        body: note.body,
        // XXX: we should re-use the logic in getDangerNotes, need to check what inline comment template we're using if
        // any
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

    //Even when we don't set danger to create threads, we still need to delete them if someone answered to a single
    // comment created by danger, resulting in a discussion/thread. Otherwise we are left with dangling comments
    // that will most likely have no meaning out of context.
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
      newOrUpdatedNote = await this.createComment(newComment)
    }

    // create URL from note
    // "https://gitlab.com/group/project/merge_requests/154#note_132143425"
    return `${this.api.mergeRequestURL}#note_${newOrUpdatedNote.id}`
  }

  createComment = async (comment: string): Promise<GitLabNote> => {
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

  deleteMainComment = async (dangerID: string): Promise<boolean> => {
    //We fetch the discussions even if we are not set to use threads because users could still have replied to a
    // comment by danger and thus created a discussion/thread. To not leave dangling notes, we delete the entire thread.
    //There is no API to delete entire discussion. They can only be deleted fully by deleting every note:
    const discussions = await this.getDangerDiscussions(dangerID)
    return await this.deleteNotes(this.reduceNotesFromDiscussions(discussions))
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
    const noteFilter = await this.getDangerNoteFilter(dangerID)
    const discussions: GitLabDiscussion[] = await this.api.getMergeRequestDiscussions()
    return discussions.filter(({ notes }) => notes.length && noteFilter(notes[0]))
  }

  reduceNotesFromDiscussions = (discussions: GitLabDiscussion[]): GitLabNote[] => {
    return discussions.reduce<GitLabNote[]>((acc, { notes }) => [...acc, ...notes], [])
  }

  getDangerNotes = async (dangerID: string): Promise<GitLabNote[]> => {
    const noteFilter = await this.getDangerNoteFilter(dangerID)
    const notes: GitLabNote[] = await this.api.getMergeRequestNotes()
    return notes.filter(noteFilter)
  }

  getDangerNoteFilter = async (
    dangerID: string,
  ): Promise<(note: GitLabNote) => boolean> => {
    const { id: dangerUserId } = await this.api.getUser()
    return ({ author: { id }, body, system }: GitLabNote): boolean => {
      return !system && // system notes are generated when the user interacts with the UI e.g. changing a PR title
        id === dangerUserId &&
        //we do not check the `type` - it's `null` most of the time,
        // only in discussions/threads this is `DiscussionNote` for all notes. But even if danger only creates a
        // normal `null`-comment, any user replying to that comment will turn it into a `DiscussionNote`-typed one.
        // So we cannot assume anything here about danger's note type.
        body.includes(dangerIDToString(dangerID))
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
  },
  api: api.apiInstance,
})
