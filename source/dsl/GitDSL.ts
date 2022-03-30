// Please don't have includes in here that aren't inside the DSL folder, or the d.ts/flow defs break

import { GitCommit } from "./Commit"
import { Chainsmoker } from "../commands/utils/chainsmoker"
import { File } from "parse-diff"

/** All Text diff values will be this shape */
export interface TextDiff {
  /** The value before the PR's applied changes */
  before: string
  /** The value after the PR's applied changes */
  after: string
  /** A string containing the full set of changes */
  diff: string
  /** A string containing just the added lines */
  added: string
  /** A string containing just the removed lines */
  removed: string
}

/** Git diff sliced into chunks */
export interface StructuredDiff {
  /** Git diff chunks */
  chunks: File["chunks"]
}

/** The results of running a JSON patch */
export interface JSONPatch {
  /** The JSON in a file at the PR merge base */
  before: any
  /** The JSON in a file from the PR submitter */
  after: any
  /** The set of operations to go from one JSON to another JSON */
  diff: JSONPatchOperation[]
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
  /** If both before & after are arrays, then you optionally get what is added. Empty if no additional objects. */
  added?: any
  /** If both before & after are arrays, then you optionally get what is removed. Empty if no removed objects. */
  removed?: any
}

/** A map of string keys to JSONDiffValue */
export interface JSONDiff {
  [name: string]: JSONDiffValue
}

// This is `danger.git`

/**
 *
 * The Git Related Metadata which is available inside the Danger DSL JSON
 *
 * @namespace JSONDSL
 */

export interface GitJSONDSL {
  /**
   * Filepaths with changes relative to the git root
   */
  readonly modified_files: string[]

  /**
   * Newly created filepaths relative to the git root
   */
  readonly created_files: string[]

  /**
   * Removed filepaths relative to the git root
   */
  readonly deleted_files: string[]

  /** The Git commit metadata */
  readonly commits: GitCommit[]
}

/** The shape of the Chainsmoker response */
type GitMatchResult = {
  /** Did any file paths match from the git modified list? */
  modified: any
  /** Did any file paths match from the git created list? */
  created: any
  /** Did any file paths match from the combination of the git modified and created list? */
  edited: any
  /** Did any file paths match from the git deleted list? */
  deleted: any
}

/** The git specific metadata for a PR */
export interface GitDSL extends GitJSONDSL {
  /**
   * The git commit Danger is comparing from.
   */
  base: string

  /**
   * The git commit Danger is comparing to.
   */
  head: string

  /**
   * A Chainsmoker object to help match paths as an elegant DSL. It
   * lets you write a globbed string and then get booleans on whether
   * there are matches within a certain part of the git DSL.
   *
   * Use this to create an object which has booleans set on 4 keys
   * `modified`, `created`, `edited` (created + modified) and `deleted`.
   *
   * @example
   * const packageJSON = danger.git.fileMatch("package.json")
   * const lockfile = danger.git.fileMatch("yarn.lock")
   *
   * if (packageJSON.modified && !lockfile.modified) {
   *    warn("You might have forgotten to run `yarn`.")
   * }
   *
   * @example
   * const needsSchemaChange = danger.git.fileMatch("src/app/analytics/*.ts")
   * const schema = danger.git.fileMatch("src/app/analytics/schema.ts")
   *
   * if (needsSchemaChange.edited && !schema.modified) {
   *    fail("Changes to the analytics files need to edit update the schema.")
   * }
   */
  fileMatch: Chainsmoker<GitMatchResult>

  /**
   * Offers the diff for a specific file
   *
   * @param {string} filename the path to the json file
   */
  diffForFile(filename: string): Promise<TextDiff | null>

  /**
   * Offers the structured diff for a specific file
   *
   * @param {string} filename the path to the json file
   */
  structuredDiffForFile(filename: string): Promise<StructuredDiff | null>

  /**
   * Provides a JSON patch (rfc6902) between the two versions of a JSON file,
   * returns null if you don't have any changes for the file in the diff.
   *
   * Note that if you are looking to just see changes like: before, after, added or removed - you
   * should use `JSONDiffForFile` instead, as this can be a bit unwieldy for a Dangerfile.
   *
   * @param {string} filename the path to the json file
   */
  JSONPatchForFile(filename: string): Promise<JSONPatch | null>

  /**
   * Provides a simplified JSON diff between the two versions of a JSON file. This will always
   * be an object whose keys represent what has changed inside a JSON file.
   *
   * Any changed values will be represented with the same path, but with a different object instead.
   * This object will always show a `before` and `after` for the changes. If both values are arrays or
   * objects the `before` and `after`, then there will also be `added` and `removed` inside the object.
   *
   * In the case of two objects, the `added` and `removed` will be an array of keys rather than the values.
   *
   * This object is represented as `JSONDiffValue` but I don't know how to make TypeScript force
   * declare that kind of type structure.
   *
   * This should make it really easy to do work when specific keypaths have changed inside a JSON file.
   *
   * @param {string} filename the path to the json file
   */
  JSONDiffForFile(filename: string): Promise<JSONDiff>

  /**
   * Offers the overall lines of code added/removed in the diff
   *
   * @param {string} pattern an option glob pattern to filer files that will considered for lines of code.
   */
  linesOfCode(pattern?: string): Promise<number | null>
}
