import { BitBucketServerPRDSL, RepoMetaData as BitBucketServerRepoMetaData } from "./BitBucketServerDSL"

export interface BitBucketCloudPagedResponse<T> {
  pagelen: number
  size: number
  page: number
  next: string | undefined
  previous: string | undefined
  values: T[]
}

export type BitBucketCloudPRDSL = BitBucketServerPRDSL
export type RepoMetaData = BitBucketServerRepoMetaData

export interface BitBucketCloudUser {
  /** The uuid of the commit author */
  uuid: string

  /** The display name of the commit author */
  display_name: string

  /** The nick name of the commit author */
  nickname: string

  /** The acount id of the commit author */
  account_id: string
}

/** A BitBucketServer specific implementation of a git commit. */
export interface BitBucketCloudCommit {
  /** The SHA for the commit */
  hash: string

  /** The author of the commit, assumed to be the person who wrote the code. */
  author: BitBucketCloudUser

  /** When the commit was commited to the project, in ISO 8601 format */
  date: string
  /** The commit's message */
  message: string
  /** The commit's parents */
  parents: {
    /** The full SHA */
    hash: string
  }[]
}

export interface BitBucketCloudPRLink {
  id: number
  links: {
    self: {
      href: string
    }
    html: {
      href: string
    }
  }
  title: string
}

export interface BitBucketCloudContent {
  raw: string
  markup: string
  html: string
  type: "rendered"
}

export interface BitBucketCloudPRComment {
  deleted: boolean
  pullrequest: BitBucketCloudPRLink
  content: BitBucketCloudContent

  /** When the comment was created, in ISO 8601 format */
  created_on: string
  user: BitBucketCloudUser

  /** When the comment was updated, in ISO 8601 format */
  updated_on: string
  type: string
  id: number
}

export interface BitBucketCloudPRActivity {
  comment?: BitBucketCloudPRComment
  pull_request: {
    id: number
    title: string
  }
}
