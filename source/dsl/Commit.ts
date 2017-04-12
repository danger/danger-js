/** A platform agnostic reference to a Git commit */
export interface GitCommit {
  /** The SHA for the commit */
  sha: string,
  /** Who wrote the commit */
  author: GitCommitAuthor,
  /** Who deployed the commit */
  committer: GitCommitAuthor,
  /** The commit message */
  message: string,
  /** Potential parent commits, and other assorted metadata */
  tree: any,
  /** SHAs for the commit's parents */
  parents?: string[],
  /** Link to the commit */
  url: string
}

/** An author of a commit */
export interface GitCommitAuthor {
  /** The display name for the author */
  name: string,
  /** The authors email */
  email: string,
  /** ISO6801 date string */
  date: string
}
