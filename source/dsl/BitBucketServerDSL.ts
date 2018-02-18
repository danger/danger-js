// This is `danger.bitbucket_server` inside the JSON

export interface BitBucketServerJSONDSL {
  /** The related JIRA issues */
  issues: JIRAIssue[]
  /** The PR metadata */
  pr: BitBucketServerPRDSL
  /** The commits associated with the pull request */
  commits: BitBucketServerCommit[]
  /** The comments on the pull request */
  comments: BitBucketServerPRActivity[]
  /** The activities such as OPENING, CLOSING, MERGING or UPDATING a pull request */
  activities: BitBucketServerPRActivity[]
}

// This is `danger.bitbucket_server`

/** The BitBucketServer metadata for your PR */
export interface BitBucketServerDSL extends BitBucketServerJSONDSL {}

/**
 * This is `danger.bitbucket_server.issues` It refers to the issues that are linked to the Pull Request.
 */
export interface JIRAIssue {
  key: string
  url: string
}

// This is `danger.bitbucket_server.pr`

/**
 * An exact copy of the PR's reference JSON. This interface has type'd the majority
 * of it for tooling's sake, but any extra metadata which BitBucket Server send
 * will still be inside the JS object.
 */

export interface BitBucketServerPRDSL {
  id: number
  version: number
  title: string
  description: string
  state: "OPEN" | "MERGED" | "DECLINED"
  open: boolean
  closed: boolean
  createdDate: number
  updatedDate: number
  fromRef: BitBucketServerMergeRef
  toRef: BitBucketServerMergeRef
  locked: boolean
  author: BitBucketServerPRParticipant & { role: "AUTHOR" }
  reviewers: (BitBucketServerPRParticipant & { role: "REVIEWER" })[]
  participants: (BitBucketServerPRParticipant & { role: "PARTICPANT" })[]
  links: BitBucketServerLinks<"self">
}

// These are the individual subtypes of objects inside the larger DSL objects above.

/** A BitBucketServer specific implmentation of a git commit. */
export interface BitBucketServerCommit {
  id: string
  displayId: string
  author: {
    name: string
    emailAddress: string
  }
  authorTimestamp: number
  committer: {
    name: string
    emailAddress: string
  }
  committerTimestamp: number
  message: string
  parents: {
    id: string
    displayId: string
  }[]
}

export type BitBucketServerPRStatus = "APPROVED" | "UNAPPROVED" | "NEEDS_WORK"

export interface BitBucketServerPRParticipant {
  user: BitBucketServerUser
  role: "AUTHOR" | "REVIEWER" | "PARTICIPANT"
  approved: boolean
  status: BitBucketServerPRStatus
}

/**
 * A BitBucketServer user account.
 */
export interface BitBucketServerUser {
  name: string
  emailAddress: string
  id: number
  displayName: string
  active: boolean
  slug: string
  type: "NORMAL"
}

/**
 * A BitBucket Server Repo
 */
export interface BitBucketServerRepo {
  slug: string
  name?: string
  scmId: string
  public: boolean
  forkable: boolean
  links: BitBucketServerLinks<"self" | "clone">

  project: {
    id: number
    key: string
    public: boolean
    name: string
    type: string
    links: BitBucketServerLinks<"self">
  }
}

export type BitBucketServerLinks<Names> = {
  [key in keyof Names]: {
    href: string
    name?: string
  }[]
}

export interface BitBucketServerMergeRef {
  id: string
  displayId: string
  latestCommit: string
  repository: BitBucketServerRepo
}

export interface BitBucketServerPRActivity {
  action: "COMMENTED" | "OPENED" | "MERGED" | "DECLINED" | "UPDATED"
  comment?: BitBucketServerPRComment
  commentAction?: "ADDED" | "UPDATED"
  commentAnchor?: {
    diffType: "COMMIT" | "EFFECTIVE" | "REQUIRED" | "RANGE"
    line: number
    lineType: "CONTEXT" | "ADDED" | "REMOVED"
    fileType: "FROM" | "TO"
    fromHash: string
    path: string
    srcPath: string
    toHash: string
  }
  createdDate: number
  id: number
  user: BitBucketServerUser
}

export interface BitBucketServerPRComment {
  author: BitBucketServerUser
  comments: BitBucketServerPRActivity[]
  createdDate: number
  updatedDate: number
  id: number
  permittedOperations: {
    deletable: boolean
    editable: boolean
  }
  text: string
  version: number
  parent?: {
    id: number
  }
}
