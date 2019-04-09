import GitLabAPI from "./gitlab/GitLabAPI"
import { Platform, Comment } from "./platform"
import { readFileSync } from "fs"
import { GitDSL, GitJSONDSL } from "../dsl/GitDSL"
import { GitCommit } from "../dsl/Commit"
import { GitLabDSL, GitLabNote } from "../dsl/GitLabDSL"

import { debug } from "../debug"
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
  getPlatformReviewDSLRepresentation = async (): Promise<GitLabDSL> => {
    const mr = await this.getReviewInfo()
    const commits = await this.api.getMergeRequestCommits()
    // const comments: any[] = [] //await this.api.getMergeRequestComments()
    // const activities = {} //await this.api.getPullRequestActivities()
    // const issues: any[] = [] //await this.api.getIssues()

    return {
      metadata: this.api.repoMetadata,
      // issues,
      mr,
      commits,
      // comments,
      utils: {},
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
        //url: `${this.api.mergeRequestURL}/diffs?commit_id=${commit.id}`,
        tree: null,
      }
    })

    // XXX: does "renamed_file"/move count is "delete/create", or "modified"?
    const modified_files: string[] = changes
      .filter(change => change.new_file === false && change.deleted_file == false)
      .map(change => change.new_path)
    const created_files: string[] = changes.filter(change => change.new_file === true).map(change => change.new_path)
    const deleted_files: string[] = changes
      .filter(change => change.deleted_file === true)
      .map(change => change.new_path)

    return {
      modified_files,
      created_files,
      deleted_files,
      commits: mappedCommits,
      // diffForFile: async () => ({ before: "", after: "", diff: "", added: "", removed: "" }),
      // structuredDiffForFile: async () => ({ chunks: [] }),
      // JSONDiffForFile: async () => ({} as any),
      // JSONPatchForFile: async () => ({} as any),
      // linesOfCode: async () => 0,
    }
  }

  getInlineComments = async (dangerID: string): Promise<Comment[]> => {
    const dangerUserID = (await this.api.getUser()).id

    const comments = (await this.api.getMergeRequestInlineNotes()).map(note => {
      return {
        id: `${note.id}`,
        body: note.body,
        ownedByDanger: note.author.id === dangerUserID && note.body.includes(dangerID),
      }
    })

    return comments
  }

  supportsCommenting() {
    return true
  }

  supportsInlineComments() {
    return true
  }

  updateOrCreateComment = async (dangerID: string, newComment: string): Promise<string> => {
    d("updateOrCreateComment", { dangerID, newComment })

    const dangerUserID = (await this.api.getUser()).id

    const existing = await this.api.getMergeRequestNotes()
    const dangered = existing
      .filter(note => note.author.id === dangerUserID && note.body.includes(dangerID))
      .filter(note => note.type == null) // we only want "normal" comments on the main body of the MR

    let note: GitLabNote

    if (dangered.length) {
      // update the first
      note = await this.api.updateMergeRequestNote(dangered[0].id, newComment)

      // delete the rest
      for (let deleteme of dangered) {
        if (deleteme === dangered[0]) {
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

  deleteMainComment = async (): Promise<boolean> => {
    d("deleteMainComment", {})
    return true
  }

  updateStatus = async (): Promise<boolean> => {
    d("updateStatus", {})
    return true
  }

  getFileContents = (path: string) => new Promise<string>(res => res(readFileSync(path, "utf8")))
}

export default GitLab
