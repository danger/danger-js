import GitLabAPI from "./gitlab/GitLabAPI"
import { Platform, Comment } from "./platform"
import { readFileSync } from "fs"
import { GitDSL, GitJSONDSL } from "../dsl/GitDSL"
import { GitCommit } from "../dsl/Commit"
import { GitLabDSL } from "../dsl/GitLabDSL"

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
    // const commits = await this.api.getMergeRequestCommits()
    // const comments: any[] = [] //await this.api.getMergeRequestComments()
    // const activities = {} //await this.api.getPullRequestActivities()
    // const issues: any[] = [] //await this.api.getIssues()

    return {
      metadata: this.api.repoMetadata,
      // issues,
      mr,
      // commits,
      // comments,
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

  getInlineComments = async (_: string): Promise<Comment[]> => {
    const comments = (await this.api.getMergeRequestInlineComments()).map(comment => {
      return {
        id: `${comment.id}`,
        body: comment.body,
        ownedByDanger: comment.author.id === 1,
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

  updateOrCreateComment = async (_dangerID: string, _newComment: string): Promise<string> => {
    return "https://gitlab.com/group/project/merge_requests/154#note_132143425"
  }

  createComment = async (_comment: string): Promise<any> => {
    return true
  }

  createInlineComment = async (_git: GitDSL, _comment: string, _path: string, _line: number): Promise<any> => {
    return true
  }

  updateInlineComment = async (_comment: string, _commentId: string): Promise<any> => {
    return true
  }

  deleteInlineComment = async (_id: string): Promise<boolean> => {
    return true
  }

  deleteMainComment = async (): Promise<boolean> => {
    return true
  }

  updateStatus = async (): Promise<boolean> => {
    return true
  }

  getFileContents = (path: string) => new Promise<string>(res => res(readFileSync(path, "utf8")))
}

export default GitLab
