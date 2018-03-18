import { Env, CISource } from "../ci_source"

export class LocalRepo implements CISource {
  private readonly env: Env

  constructor(env: Env) {
    const defaults = {
      repo: process.cwd(),
      pr: undefined,
    }

    this.env = { ...env, ...defaults }
  }
  get name(): string {
    return "local repo"
  }

  get isCI(): boolean {
    return true
  }
  get isPR(): boolean {
    return true
  }

  get pullRequestID(): string {
    return ""
  }
  get repoSlug(): string {
    return this.env.repo
  }
}
