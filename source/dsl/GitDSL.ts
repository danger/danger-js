import { GitCommit } from "./Commit"

/** The results of running a JSON patch */
export interface JSONPatch {
  /** The JSON in a file at the PR merge base */
  before: any,
  /** The JSON in a file from the PR submitter */
  after: any,
  /** The set of operations to go from one JSON to another JSON */
  diff: Array<JSONPatchOperation>
}

/** An individual operation inside an rfc6902 JSON Patch */
export interface JSONPatchOperation {
  /** An operation type */
  op: string
  /** The JSON keypath which the operation applies on */
  path: string
  /** The changes for applied */
  value: string
}

/** All JSON diff values will be this shape */
export interface JSONDiffValue {
  /** The value before the PR's applied changes */
  before: any
  /** The value after the PR's applied changes */
  after: any
  /** If both before & after are arrays, then you optionally get what is added. Emprty is no additional objects. */
  added?: any[],
  /** If both before & after are arrays, then you optionally get what is removed. Emprty is no removed objects. */
  removed?: any[]
}

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

  /** Provides a JSON patch (rfc6902) between the two versions of a JSON file, returns null if you don't have any changes for the file in the diff. */
  JSONPatchForFile(filename: string): Promise<JSONPatch | null>,

  /** Provides a simplified JSON diff between the two versions of a JSON file */
  JSONDiffForFile(filename: string): Promise<Array<any>>,

  /** The Git commit metadata */
  readonly commits: Readonly<Array<GitCommit>>
}
