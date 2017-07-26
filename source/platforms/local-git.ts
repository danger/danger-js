import { GitDSL } from "../dsl/GitDSL"
import { Platform } from "./platform"

export class LocalGit implements Platform {
  public readonly name: string

  constructor() {
    this.name = "local git"
  }

  async getPlatformDSLRepresentation(): Promise<any> {
    return {}
  }

  async getPlatformGitRepresentation(): Promise<GitDSL> {
    return {
      modified_files: [],
      created_files: [],
      deleted_files: [],
      diffForFile: async () => ({ before: "", after: "", diff: "", added: "", removed: "" }),
      JSONDiffForFile: async () => ({} as any),
      JSONPatchForFile: async () => ({} as any),
      commits: [],
    }
  }

  async updateOrCreateComment(_newComment: string): Promise<boolean> {
    return true
  }

  async createComment(_comment: string): Promise<any> {
    return true
  }

  async deleteMainComment(): Promise<boolean> {
    return true
  }

  async editMainComment(_comment: string): Promise<boolean> {
    return true
  }

  async updateStatus(_success: boolean, _message: string): Promise<boolean> {
    return true
  }
}
