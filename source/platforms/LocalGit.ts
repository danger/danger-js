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
  private gitDiff: string

  constructor(public readonly options: LocalGitOptions) {
    this.name = "local git"
  }

  async getGitDiff(): Promise<string> {
    if (this.gitDiff) {
      return this.gitDiff
    }
    const base = this.options.base || "master"
    const head = "HEAD"

    this.gitDiff = await localGetDiff(base, head)
    return this.gitDiff
  }

  async validateThereAreChanges(): Promise<boolean> {
    const diff = await this.getGitDiff()
    return diff.trim().length > 0
  }

  async getPlatformDSLRepresentation(): Promise<any> {
    return null
  }

  async getPlatformGitRepresentation(): Promise<GitDSL> {
    const base = this.options.base || "master"
    const head = "HEAD"
    const diff = await this.getGitDiff()
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

  async createInlineComment(_comment: string, _commitId: string, _path: string, _position: number): Promise<any> {
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
