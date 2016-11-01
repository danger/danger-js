
export default class DangerDSL {
  git: GitDSL
  github: GitHubDSL

  constructor(pr: any, git: GitDSL) {
    this.git = git
    this.github = {
      pr
    }
  }
}

export interface GitDSL {
  modified_files: string[],
  created_files: string[],
  deleted_files: string[]
}

export interface GitHubDSL {
    pr: GitHubPRDSL
}

export interface GitHubUser {
    id: number,
    login: string,
    type: "User" | "Organization"
}

export interface GitHubRepo {
    id: number,
    name: string,
    full_name: string,
    owner: GitHubUser,
    private: bool,
    description: string,
    fork: false
}

export interface GitHubSHARef {
    label: string,
    ref: string,
    sha: string,
    user: GitHubUser
}

export interface GitHubPRDSL {
  number: number,
  state: "closed" | "open" | "locked" | "merged",
  locked: boolean,
  title: string,
  body: string,
  created_at: string,
  updated_at: string,
  closed_at: ?string,
  merged_at: ?string,
  head: GitHubSHARef,
  base: GitHubSHARef
}

declare var danger: DangerDSL
