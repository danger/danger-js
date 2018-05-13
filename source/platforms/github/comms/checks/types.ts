// TODO, do we want this?

export interface Output {
  title: string
  summary: string
  text: string
}

export interface CheckSuite {
  id: number
}

export interface Owner {
  login: string
  id: number
  url: string
  repos_url: string
  events_url: string
  hooks_url: string
  issues_url: string
  members_url: string
  public_members_url: string
  avatar_url: string
  description: string
}

export interface App {
  id: number
  owner: Owner
  name: string
  description: string
  external_url: string
  html_url: string
  created_at: Date
  updated_at: Date
}

export interface Repo {
  id: number
  url: string
  name: string
}

export interface Head {
  ref: string
  sha: string
  repo: Repo
}

export interface Repo2 {
  id: number
  url: string
  name: string
}

export interface Base {
  ref: string
  sha: string
  repo: Repo2
}

export interface PullRequest {
  url: string
  id: number
  head: Head
  base: Base
}

export interface RootObject {
  id: number
  head_sha: string
  external_id: string
  url: string
  html_url: string
  status: string
  conclusion?: any
  started_at: Date
  completed_at?: any
  output: Output
  name: string
  check_suite: CheckSuite
  app: App
  pull_requests: PullRequest[]
}
export interface Output {
  title: string
  summary: string
  text: string
}

export interface CheckSuite {
  id: number
}

export interface Owner {
  login: string
  id: number
  url: string
  repos_url: string
  events_url: string
  hooks_url: string
  issues_url: string
  members_url: string
  public_members_url: string
  avatar_url: string
  description: string
}

export interface App {
  id: number
  owner: Owner
  name: string
  description: string
  external_url: string
  html_url: string
  created_at: Date
  updated_at: Date
}

export interface Repo {
  id: number
  url: string
  name: string
}

export interface Head {
  ref: string
  sha: string
  repo: Repo
}

export interface Repo2 {
  id: number
  url: string
  name: string
}

export interface Base {
  ref: string
  sha: string
  repo: Repo2
}

export interface PullRequest {
  url: string
  id: number
  head: Head
  base: Base
}

export interface Check {
  id: number
  head_sha: string
  external_id: string
  url: string
  html_url: string
  status: string
  conclusion?: any
  started_at: Date
  completed_at?: any
  output: Output
  name: string
  check_suite: CheckSuite
  app: App
  pull_requests: PullRequest[]
}
