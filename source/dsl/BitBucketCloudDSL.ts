// Please don't have includes in here that aren't inside the DSL folder, or the d.ts/flow defs break

// TODO: extract out from BitBucket specifically, or create our own type
import { RepoMetaData } from "../dsl/BitBucketServerDSL"

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

export interface BitBucketCloudAPIDSL {
  /** Gets the contents of a file from a repo (defaults to yours) */
  getFileContents(filePath: string, repoSlug?: string, refspec?: string): Promise<string>

  /** Make a get call against the bitbucket server API */
  get(path: string, headers: any, suppressErrors?: boolean): Promise<any>

  /** Make a post call against the bitbucket server API */
  post(path: string, headers: any, body: any, suppressErrors?: boolean): Promise<any>

  /** Make a put call against the bitbucket server API */
  put(path: string, headers: any, body: any): Promise<any>

  /** Make a delete call against the bitbucket server API */
  delete(path: string, headers: any, body: any): Promise<any>
}

export interface BitBucketCloudDSL extends BitBucketCloudJSONDSL {
  /**
   * An authenticated API so you can extend danger's behavior.
   */
  api: BitBucketCloudAPIDSL
}

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
  /** When the pr was created, in ISO 8601 format */
  created_on: string
  /** When the pr was updated, in ISO 8601 format */
  updated_on: string
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
  /*The user who participated in this PR  */
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

/** A BitBucketCloud specific implementation of a git commit. */
export interface BitBucketCloudCommit {
  /** The SHA for the commit */
  hash: string

  /** The author of the commit, assumed to be the person who wrote the code. */
  author: {
    /** Format: `Foo Bar <foo@bar.com>` */
    raw: string
    user: BitBucketCloudUser
  }

  /** When the commit was committed to the project, in ISO 8601 format */
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
  links: BitBucketCloudLinks<"self" | "html">

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

  inline?: {
    to: number | null
    from: number
    path: string
  }
}

export interface BitBucketCloudPRActivity {
  comment?: BitBucketCloudPRComment
  pull_request: {
    id: number
    title: string
  }
}
