import { RepoMetaData as BitBucketServerRepoMetaData } from "./BitBucketServerDSL"

export interface BitBucketCloudJSONDSL {
  /** The pull request and repository metadata */
  metadata: RepoMetaData
  /** The PR metadata */
  pr: BitBucketCloudPRDSL
  /** The commits associated with the pull request */
  commits: BitBucketCloudCommit[]
  /** The comments on the pull request */
  comments: BitBucketCloudPRComment[]
  /** The activities such as OPENING, CLOSING, MERGING or UPDATING a pull request */
  activities: BitBucketCloudPRActivity[]
}

export interface BitBucketCloudDSL extends BitBucketCloudJSONDSL {}

export interface BitBucketCloudPagedResponse<T> {
  pagelen: number
  size: number
  page: number
  next: string | undefined
  previous: string | undefined
  values: T[]
}
export interface BitBucketCloudPRDSL {
  /** The PR's ID */
  id: number
  /** Title of the pull request. */
  title: string
  /** The text describing the PR */
  description: string
  /** The pull request's current status. */
  state: "OPEN" | "MERGED" | "DECLINED" | "SUPERSEDED"
  /** Date PR created as number of milliseconds since the unix epoch */
  created_on: number
  /** Date PR updated as number of milliseconds since the unix epoch */
  updated_on: number
  /** The PR's source, The repo Danger is running on  */
  source: BitBucketCloudMergeRef
  /** The PR's destination */
  destination: BitBucketCloudMergeRef
  /** The creator of the PR */
  author: BitBucketCloudUser
  /** People requested as reviewers */
  reviewers: BitBucketCloudUser[]
  /** People who have participated in the PR */
  participants: BitBucketCloudPRParticipant[]
  /** Misc links for hypermedia conformance */
  links: BitBucketCloudLinks<
    "decline" | "commits" | "self" | "comments" | "merge" | "html" | "activity" | "diff" | "approve" | "statuses"
  >
}

export interface BitBucketCloudMergeRef {
  commit: {
    hash: string
  }
  branch: {
    name: string
  }
  repository: BitBucketCloudRepo
}

export type BitBucketCloudLinks<Names extends string> = {
  [key in Names]: {
    href: string
  }
}

export interface BitBucketCloudPRParticipant {
  /*The user for  */
  user: BitBucketCloudUser

  /** How did they contribute */
  role: "REVIEWER" | "PARTICIPANT"

  /** Did they approve of the PR? */
  approved: boolean
}

export interface BitBucketCloudRepo {
  name: string
  full_name: string
  uuid: string
}

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
  author: {
    /** Format: `Foo Bar <foo@bar.com>` */
    raw: string
    user: BitBucketCloudUser
  }

  /** When the commit was commited to the project, in ISO 8601 format */
  date: string
  /** The commit's message */
  message: string
  /** The commit's parents */
  parents: {
    /** The full SHA */
    hash: string
  }[]

  /** The commit's links */
  links: BitBucketCloudLinks<"html">
}

export interface BitBucketCloudContent {
  raw: string
  markup: string
  html: string
  type: "rendered"
}

export interface BitBucketCloudPRComment {
  deleted: boolean
  pullrequest: {
    id: number
    links: BitBucketCloudLinks<"self" | "html">
    title: string
  }
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
