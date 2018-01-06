import { GitDSL } from "../dsl/GitDSL"
import { Platform } from "./platform"
import { gitJSONToGitDSL, GitJSONToGitDSLConfig } from "./git/gitJSONToGitDSL"
import { diffToGitJSONDSL } from "./git/diffToGitJSONDSL"
import { GitCommit } from "../dsl/Commit"
import { localGetDiff } from "./git/localGetDiff"
import { localGetFileAtSHA } from "./git/localGetFileAtSHA"

export interface LocalGitOptions {
  base?: string
  staged?: boolean
}

export class LocalGit implements Platform {
  public readonly name: string

  constructor(public readonly options: LocalGitOptions) {
    this.name = "local git"
  }

  async getPlatformDSLRepresentation(): Promise<any> {
    return null
  }

  async getPlatformGitRepresentation(): Promise<GitDSL> {
    const diff = ""
    const commits: GitCommit[] = []
    const gitJSON = diffToGitJSONDSL(diff, commits)

    const config: GitJSONToGitDSLConfig = {
      repo: process.cwd(),
      baseSHA: this.options.base,
      headSHA: "HEAD",
      getFileContents: localGetFileAtSHA,
      getFullDiff: localGetDiff,
    }

    return gitJSONToGitDSL(gitJSON, config)
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
