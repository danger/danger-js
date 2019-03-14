/** Key details about a repo */
export interface RepoMetaData {
  /** A path like "artsy/eigen" */
  repoSlug: string
  /** The ID for the pull/merge request "11" */
  pullRequestID: string
}

// This is `danger.bitbucket_server` inside the JSON

export interface BitBucketServerJSONDSL {
  /** The pull request and repository metadata */
  metadata: RepoMetaData
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
  /** The unique key for the issue e.g. JRA-11 */
  key: string
  /** The user-facing URL for that issue */
  url: string
}

// This is `danger.bitbucket_server.pr`
//
//  References:
//  -  https://developer.atlassian.com/bitbucket/api/2/reference/resource/repositories/%7Busername%7D/%7Brepo_slug%7D/pullrequests/%7Bpull_request_id%7D
//  - https://docs.atlassian.com/bitbucket-server/javadoc/4.3.2/api/reference/classes.html

/**
 * An exact copy of the PR's reference JSON. This interface has type'd the majority
 * of it for tooling's sake, but any extra metadata which BitBucket Server send
 * will still be inside the JS object.
 */

export interface BitBucketServerPRDSL {
  /** The PR's ID */
  id: number
  /** The API version */
  version: number
  /** Title of the pull request. */
  title: string
  /** The text describing the PR */
  description: string
  /** The pull request's current status. */
  state: "OPEN" | "MERGED" | "DECLINED" | "SUPERSEDED"
  /** Is the PR open? */
  open: boolean
  /** Is the PR closed? */
  closed: boolean
  /** Date PR created as number of milliseconds since the unix epoch */
  createdDate: number
  /** Date PR updated as number of milliseconds since the unix epoch */
  updatedDate: number
  /** The PR submitter's reference */
  fromRef: BitBucketServerMergeRef
  /** The repo Danger is running on */
  toRef: BitBucketServerMergeRef
  /** Was this PR locked? */
  locked: boolean
  /** The creator of the PR */
  author: BitBucketServerPRParticipant & { role: "AUTHOR" }
  /** People requested as reviewers */
  reviewers: (BitBucketServerPRParticipant & { role: "REVIEWER" })[]
  /** People who have participated in the PR */
  participants: (BitBucketServerPRParticipant & { role: "PARTICIPANT" })[]
  /** Misc links for hypermedia conformance */
  links: BitBucketServerLinks<"self">
}

// These are the individual subtypes of objects inside the larger DSL objects above.

/** A BitBucketServer specific implementation of a git commit. */
export interface BitBucketServerCommit {
  /** The SHA for the commit */
  id: string
  /** The shortened SHA for the commit */
  displayId: string
  /** The author of the commit, assumed to be the person who wrote the code. */
  author: {
    /** The id of the commit author */
    name: string
    /** The display name of the commit author */
    displayName: string
    /** The email of the commit author */
    emailAddress: string
  }
  /** The UNIX timestamp for when the commit was authored */
  authorTimestamp: number
  /** The author of the commit, assumed to be the person who commited/merged the code into a project. */
  committer: {
    /** The id of the commit committer */
    name: string
    /** The display name of the commit committer */
    displayName: string
    /** The email of the commit committer */
    emailAddress: string
  }
  /** When the commit was commited to the project */
  committerTimestamp: number
  /** The commit's message */
  message: string
  /** The commit's parents */
  parents: {
    /** The full SHA */
    id: string
    /** The simplified sha */
    displayId: string
  }[]
}

export interface BitBucketServerDiff {
  /** The file refrence when moved */
  destination?: BitBucketServerFile
  /** The original file refrence */
  source?: BitBucketServerFile
  /** A set of diff changes */
  hunks: BitBucketServerHunk[]
  /** If the hunk is massive, then it will be truncated */
  truncated: boolean
  /** The commit SHA which changed this hunk */
  toHash: string
  /** Last SHA where this hunk was changed */
  fromHash: string
  /** The settings for the whitespace */
  whitespace: "SHOW" | "IGNORE_ALL"
}

export interface BitBucketServerFile {
  components: string[]
  name: string
  parent: string
  toString: string
}

export interface BitBucketServerHunk {
  destinationLine: number
  destinationSpan: number
  segments: BitBucketServerSegment[]
  sourceLine: number
  sourceSpan: number
  truncated: boolean
}

export interface BitBucketServerSegment {
  lines: BitBucketServerLine[]
  truncated: boolean
  type: "ADDED" | "REMOVED" | "CONTEXT"
}

export interface BitBucketServerLine {
  source: number
  destination: number
  line: string
  truncated: boolean
  conflictMarker?: "OURS"
  commentIds?: number[]
}

export interface BitBucketServerPRParticipant {
  /*The user for  */
  user: BitBucketServerUser
  /** How did they contribute */
  role: "AUTHOR" | "REVIEWER" | "PARTICIPANT"
  /** Did they approve of the PR? */
  approved: boolean
  /** Their review feedback */
  status: "APPROVED" | "UNAPPROVED" | "NEEDS_WORK"
}

/**
 * A BitBucketServer user account.
 */
export interface BitBucketServerUser {
  /** The name of the user */
  name: string
  /** The email for the user */
  emailAddress: string
  /** The unique user ID */
  id: number
  /** The name to use when referencing the user */
  displayName: string
  /** Is the account active */
  active: boolean
  /** The user's slug for URLs */
  slug: string
  /** The type of a user, "NORMAL" being a typical user3 */
  type: "NORMAL" | "SERVICE"
}

/**
 * A BitBucket Server Repo
 */
export interface BitBucketServerRepo {
  /** The slug for the repo */
  slug: string
  /** The repo name */
  name?: string
  /** The type of SCM tool, probably "git" */
  scmId: string
  /** Is the repo public? */
  public: boolean
  /** Can someone fork this repo? */
  forkable: boolean
  /** Links for the projects */
  links: BitBucketServerLinks<"self" | "clone">
  /** An abstraction for grouping repos */
  project: {
    /** The project unique id */
    id: number
    /** The project's human readable project key */
    key: string
    /** Is the project publicly available */
    public: boolean
    /** The name of the project */
    name: string
    /** The project's type */
    type: string
    /** Hyperlinks for the project */
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

export interface BitBucketServerPagedResponse<T> {
  size: number
  limit: number
  isLastPage: boolean
  start: number
  filter: never | null // TODO: remove never
  nextPageStart: number | null
  values: T
}

export interface BitBucketServerChangesValueAddCopyModifyDelete {
  type: "ADD" | "COPY" | "MODIFY" | "DELETE" | "UNKNOWN"
  path: {
    toString: string
  }
}

export interface BitBucketServerChangesValueMove {
  type: "MOVE"
  path: {
    toString: string
  }
  srcPath: {
    toString: string
  }
}

// prettier-ignore
export type BitBucketServerChangesValue = BitBucketServerChangesValueAddCopyModifyDelete | BitBucketServerChangesValueMove
