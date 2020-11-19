import { GitDSL } from "../dsl/GitDSL"
import chainsmoker from "../commands/utils/chainsmoker"
import { Platform, Comment } from "./platform"
import { readFileSync } from "fs"

export class FakePlatform implements Platform {
  public readonly name: string

  constructor() {
    this.name = "Fake"
  }

  async getReviewInfo(): Promise<any> {
    return {}
  }

  async getPlatformReviewDSLRepresentation(): Promise<any> {
    return {}
  }

  async getPlatformGitRepresentation(): Promise<GitDSL> {
    return {
      base: "456",
      head: "123",
      modified_files: [],
      created_files: [],
      deleted_files: [],
      fileMatch: chainsmoker({ modified: [], created: [], deleted: [], edited: [] }),
      diffForFile: async () => ({ before: "", after: "", diff: "", added: "", removed: "" }),
      structuredDiffForFile: async () => ({ chunks: [] }),
      JSONDiffForFile: async () => ({} as any),
      JSONPatchForFile: async () => ({} as any),
      commits: [
        {
          sha: "123",
          author: { name: "1", email: "1", date: "1" },
          committer: { name: "1", email: "1", date: "1" },
          message: "456",
          tree: { sha: "123", url: "123" },
          url: "123",
        },
      ],
      linesOfCode: async () => 0,
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
    return "https://github.com/orta/github-pages-with-jekyll/pull/5#issuecomment-383402256"
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
