import GitLabAPI from "./gitlab/GitLabAPI"
import { Platform, Comment } from "./platform"
import { GitDSL, GitJSONDSL } from "../dsl/GitDSL"
import { GitCommit } from "../dsl/Commit"
import { GitLabDSL, GitLabJSONDSL, GitLabNote } from "../dsl/GitLabDSL"

import { debug } from "../debug"
import { dangerIDToString } from "../runner/templates/githubIssueTemplate"
const d = debug("GitLab")

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
        // XXX: we should re-use the logic in getDangerNotes, need to check what inline comment template we're using if any
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

    const notes: GitLabNote[] = await this.getDangerNotes(dangerID)
    debugger

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

  createComment = async (comment: string): Promise<any> => {
    d("createComment", { comment })
    return this.api.createMergeRequestNote(comment)
  }

  createInlineComment = async (git: GitDSL, comment: string, path: string, line: number): Promise<string> => {
    d("createInlineComment", { git, comment, path, line })

    const mr = await this.api.getMergeRequestInfo()

    return this.api.createMergeRequestDiscussion(comment, {
      position_type: "text",
      base_sha: mr.diff_refs.base_sha,
      start_sha: mr.diff_refs.start_sha,
      head_sha: mr.diff_refs.head_sha,
      old_path: path,
      old_line: null,
      new_path: path,
      new_line: line,
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
    const notes = await this.getDangerNotes(dangerID)
    for (let note of notes) {
      d("deleteMainComment", { id: note.id })
      await this.api.deleteMergeRequestNote(note.id)
    }

    return notes.length > 0
  }

  getDangerNotes = async (dangerID: string): Promise<GitLabNote[]> => {
    const { id: dangerUserId } = await this.api.getUser()
    const notes: GitLabNote[] = await this.api.getMergeRequestNotes()

    return notes.filter(
      ({ author: { id }, body, system, type }: GitLabNote) =>
        !system && // system notes are generated when the user interacts with the UI e.g. changing a PR title
        type == null && // we only want "normal" comments on the main body of the MR;
        id === dangerUserId &&
        body!.includes(dangerIDToString(dangerID)) // danger-id-(dangerID) is included in a hidden comment in the githubIssueTemplate
    )
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
  api,
})
