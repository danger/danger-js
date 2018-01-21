import { GitDSL } from "../dsl/GitDSL"
import { CISource } from "../ci_source/ci_source"
import { Platform } from "./platform"
import { readFileSync } from "fs-extra"

export class FakePlatform implements Platform {
  public readonly name: string
  public readonly ciSource: CISource

  constructor() {
    this.name = "Fake"
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

  supportsCommenting() {
    return true
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

  async updateStatus(_success: boolean, _message: string): Promise<boolean> {
    return true
  }

  getFileContents = (path: string) => new Promise<string>(res => res(readFileSync(path, "utf8")))
}
