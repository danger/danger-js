import { GitCommit } from "./Commit"

// This is `danger.git`

/** The git specific metadata for a PR */
export interface GitDSL {
  /**
   * Filepaths with changes relative to the git root
   * @type {string[]}
   */
  readonly modified_files: Readonly<Array<string>>

  /**
   * Newly created filepaths relative to the git root
   * @type {string[]}
   */
  readonly created_files: Readonly<Array<string>>

  /**
   * Removed filepaths relative to the git root
   * @type {string[]}
   */
  readonly deleted_files: Readonly<Array<string>>

  /** Offers the diff for a specific file */
  diffForFile(filename: string): string | null,

  /** The Git commit metadata */
  readonly commits: Readonly<Array<GitCommit>>
}
