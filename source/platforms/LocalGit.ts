import { GitDSL } from "../dsl/GitDSL"
import { Platform } from "./platform"
import { gitJSONToGitDSL, GitJSONToGitDSLConfig } from "./git/gitJSONToGitDSL"
import { diffToGitJSONDSL } from "./git/diffToGitJSONDSL"
import { GitCommit } from "../dsl/Commit"
import { localGetDiff } from "./git/localGetDiff"
import { localGetFileAtSHA } from "./git/localGetFileAtSHA"
import { localGetCommits } from "./git/localGetCommits"
import { readFileSync } from "fs"

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
    const base = this.options.base || "master"
    const head = "HEAD"

    const diff = await localGetDiff(base, head)
    const commits: GitCommit[] = await localGetCommits(base, head)
    const gitJSON = diffToGitJSONDSL(diff, commits)

    const config: GitJSONToGitDSLConfig = {
      repo: process.cwd(),
      baseSHA: this.options.base || "master",
      headSHA: "HEAD",
      getFileContents: localGetFileAtSHA,
      getFullDiff: localGetDiff,
    }

    return gitJSONToGitDSL(gitJSON, config)
  }

  supportsCommenting() {
    return false
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

  getFileContents = (path: string) => new Promise<string>(res => res(readFileSync(path, "utf8")))
}
