import GitLabAPI from "./gitlab/GitLabAPI"
import { Platform, Comment } from "./platform"
import { readFileSync } from "fs"
import { GitDSL, GitJSONDSL } from "../dsl/GitDSL"
import { GitCommit } from "../dsl/Commit"

class GitLab implements Platform {
  public readonly name: string

  constructor(public readonly api: GitLabAPI) {
    this.name = "GitLab"
  }

  async getReviewInfo(): Promise<any> {
    return this.api.getPullRequestInfo()
  }

  async getPlatformReviewDSLRepresentation(): Promise<any> {
    return {}
  }

  async getPlatformGitRepresentation(): Promise<GitJSONDSL> {
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
      // diffForFile: async () => ({ before: "", after: "", diff: "", added: "", removed: "" }),
      // structuredDiffForFile: async () => ({ chunks: [] }),
      // JSONDiffForFile: async () => ({} as any),
      // JSONPatchForFile: async () => ({} as any),
      commits: mappedCommits,
      // linesOfCode: async () => 0,
    }
  }

  async getInlineComments(_: string): Promise<Comment[]> {
    return []
  }

  supportsCommenting() {
    return true
  }

  supportsInlineComments() {
    return true
  }

  async updateOrCreateComment(_dangerID: string, _newComment: string): Promise<string> {
    return "https://gitlab.com/group/project/merge_requests/154#note_132143425"
  }

  async createComment(_comment: string): Promise<any> {
    return true
  }

  async createInlineComment(_git: GitDSL, _comment: string, _path: string, _line: number): Promise<any> {
    return true
  }

  async updateInlineComment(_comment: string, _commentId: string): Promise<any> {
    return true
  }

  async deleteInlineComment(_id: string): Promise<boolean> {
    return true
  }

  async deleteMainComment(): Promise<boolean> {
    return true
  }

  async updateStatus(): Promise<boolean> {
    return true
  }

  getFileContents = (path: string) => new Promise<string>(res => res(readFileSync(path, "utf8")))
}

export default GitLab
