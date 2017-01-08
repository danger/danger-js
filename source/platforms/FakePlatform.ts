import { GitDSL } from "../dsl/GitDSL"
import { CISource } from "../ci_source/ci_source"
import { Platform } from "./platform"

export class FakePlatform implements Platform {
  public readonly name: string
  public readonly ciSource: CISource

  constructor() {
    this.name = "Fake"
  }

  async getPlatformDSLRepresentation(): Promise<any> {
    return {}
  }

  async getReviewDiff(): Promise<GitDSL> {
    return {
      modified_files: [],
      created_files: [],
      deleted_files: [],
      diffForFile: () => "",
      commits: []
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
}
