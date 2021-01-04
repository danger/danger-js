import * as os from "os"
import parseDiff from "parse-diff"

import includes from "lodash.includes"
import isobject from "lodash.isobject"
import keys from "lodash.keys"
import memoize from "lodash.memoize"

import * as jsonDiff from "fast-json-patch"
import jsonpointer from "jsonpointer"
import JSON5 from "json5"

import micromatch from "micromatch"

import { GitDSL, JSONPatchOperation, GitJSONDSL, StructuredDiff } from "../../dsl/GitDSL"
import chainsmoker from "../../commands/utils/chainsmoker"

/*
 * As Danger JS bootstraps from JSON like all `danger process` commands
 * this file takes the original JSON, and wraps it into a complete DSL with
 * useful functions etc.
 */

export interface GitJSONToGitDSLConfig {
  /** This is used in getFileContents to figure out your repo  */
  repo?: string

  // These two will be tricky when trying to do this for staged files

  /** The sha things are going into */
  baseSHA: string
  /** The sha which we're merging */
  headSHA: string

  /** A promise which will return the string content of a file at a sha */
  getFileContents: (path: string, repo: string | undefined, sha: string) => Promise<string>
  /** A promise which will return the diff string content for a file between shas */
  getFullDiff?: (base: string, head: string) => Promise<string>
  getStructuredDiffForFile?: (base: string, head: string, filename: string) => Promise<GitStructuredDiff>
}

export type GitStructuredDiff = {
  from?: string
  to?: string
  chunks: Chunk[]
}[]

export interface Chunk {
  changes: Changes
}

export type Changes = { type: "add" | "del" | "normal"; content: string }[]

export const gitJSONToGitDSL = (gitJSONRep: GitJSONDSL, config: GitJSONToGitDSLConfig): GitDSL => {
  const getFullDiff: ((base: string, head: string) => Promise<string>) | null = config.getStructuredDiffForFile
    ? null
    : memoize(
        (base: string, head: string) => {
          return config.getFullDiff!(base, head)
        },
        (base: string, head: string) => `${base}...${head}`
      )

  /**
   * Takes a filename, and pulls from the PR the two versions of a file
   * where we then pass that off to the rfc6902 JSON patch generator.
   *
   * @param filename The path of the file
   */
  const JSONPatchForFile = async (filename: string) => {
    // We already have access to the diff, so see if the file is in there
    // if it's not return an empty diff
    if (!gitJSONRep.modified_files.includes(filename)) {
      return null
    }

    // Grab the two files contents.
    const baseFile = await config.getFileContents(filename, config.repo, config.baseSHA)
    const headFile = await config.getFileContents(filename, config.repo, config.headSHA)

    // Parse JSON. `fileContents` returns empty string for files that are
    // missing in one of the refs, ie. when the file is created or deleted.
    const baseJSON = baseFile === "" ? {} : JSON5.parse(baseFile)
    const headJSON = headFile === "" ? {} : JSON5.parse(headFile)

    // Tiny bit of hand-waving here around the types. JSONPatchOperation is
    // a simpler version of all operations inside the rfc6902 d.ts. Users
    // of danger wont care that much, so I'm smudging the classes slightly
    // to be ones we can add to the hosted docs.
    return {
      before: baseFile === "" ? null : baseJSON,
      after: headFile === "" ? null : headJSON,
      diff: jsonDiff.compare(baseJSON, headJSON) as JSONPatchOperation[],
    }
  }

  /**
   * Takes a path, generates a JSON patch for it, then parses that into something
   * that's much easier to use inside a "DSL"" like the Dangerfile.
   *
   * @param filename path of the file
   */
  const JSONDiffForFile = async (filename: string) => {
    const patchObject = await JSONPatchForFile(filename)

    if (!patchObject) {
      return {}
    }

    // Thanks to @wtgtybhertgeghgtwtg for getting this started in #175
    // The idea is to loop through all the JSON patches, then pull out the before and after from those changes.

    const { diff, before, after } = patchObject
    return diff.reduce((accumulator, { path }) => {
      // We don't want to show the last root object, as these tend to just go directly
      // to a single value in the patch. This is fine, but not useful when showing a before/after
      const pathSteps = path.split("/")
      const backAStepPath = pathSteps.length <= 2 ? path : pathSteps.slice(0, pathSteps.length - 1).join("/")

      const diff: any = {
        after: jsonpointer.get(after, backAStepPath) || null,
        before: jsonpointer.get(before, backAStepPath) || null,
      }

      const emptyValueOfCounterpart = (other: any) => {
        if (Array.isArray(other)) {
          return []
        } else if (isobject(diff.after)) {
          return {}
        }
        return null
      }

      const beforeValue = diff.before || emptyValueOfCounterpart(diff.after)
      const afterValue = diff.after || emptyValueOfCounterpart(diff.before)

      // If they both are arrays, add some extra metadata about what was
      // added or removed. This makes it really easy to act on specific
      // changes to JSON DSLs

      if (Array.isArray(afterValue) && Array.isArray(beforeValue)) {
        const arrayBefore = beforeValue as any[]
        const arrayAfter = afterValue as any[]

        diff.added = arrayAfter.filter(o => !includes(arrayBefore, o))
        diff.removed = arrayBefore.filter(o => !includes(arrayAfter, o))
        // Do the same, but for keys inside an object if they both are objects.
      } else if (isobject(afterValue) && isobject(beforeValue)) {
        const beforeKeys = keys(beforeValue) as string[]
        const afterKeys = keys(afterValue) as string[]
        diff.added = afterKeys.filter(o => !includes(beforeKeys, o))
        diff.removed = beforeKeys.filter(o => !includes(afterKeys, o))
      }

      jsonpointer.set(accumulator, backAStepPath, diff)
      return accumulator
    }, Object.create(null))
  }

  const linesOfCode = async (pattern?: string) => {
    const isPatternMatch = (path: string) => pattern === undefined || micromatch.isMatch(path, pattern)

    const [createdFilesDiffs, modifiedFilesDiffs, deletedFilesDiffs] = await Promise.all([
      Promise.all(gitJSONRep.created_files.filter(isPatternMatch).map(path => diffForFile(path))),
      Promise.all(gitJSONRep.modified_files.filter(isPatternMatch).map(path => diffForFile(path))),
      Promise.all(gitJSONRep.deleted_files.filter(isPatternMatch).map(path => diffForFile(path))),
    ])

    let additions = createdFilesDiffs
      .map(diff => (!diff ? 0 : diff.added === "" ? 0 : diff.added.split("\n").length))
      .reduce((mem, value) => mem + value, 0)
    let deletions = deletedFilesDiffs
      .map(diff => (!diff ? 0 : diff.removed === "" ? 0 : diff.removed.split("\n").length))
      .reduce((mem, value) => mem + value, 0)
    const modifiedLines = modifiedFilesDiffs.map(diff => [
      !diff ? 0 : diff.added === "" ? 0 : diff.added.split("\n").length,
      !diff ? 0 : diff.removed === "" ? 0 : diff.removed.split("\n").length,
    ])

    additions = modifiedLines.reduce((mem, value) => mem + value[0], additions)
    deletions = modifiedLines.reduce((mem, value) => mem + value[1], deletions)

    return additions + deletions
  }

  const byType = (t: string) => ({ type }: { type: string }) => type === t
  const getContent = ({ content }: { content: string }) => content

  /**
   * Gets the git-style diff for a single file.
   *
   * @param filename File path for the diff
   */
  const structuredDiffForFile = async (filename: string): Promise<StructuredDiff | null> => {
    let fileDiffs: GitStructuredDiff

    if (config.getStructuredDiffForFile) {
      fileDiffs = await config.getStructuredDiffForFile(config.baseSHA, config.headSHA, filename)
    } else {
      const diff = await getFullDiff!(config.baseSHA, config.headSHA)
      fileDiffs = parseDiff(diff)
    }
    const structuredDiff = fileDiffs.find(diff => diff.from === filename || diff.to === filename)
    if (structuredDiff !== undefined && structuredDiff.chunks !== undefined) {
      return { chunks: structuredDiff.chunks }
    } else {
      return null
    }
  }

  /**
   * Gets the git-style diff for a single file.
   *
   * @param filename File path for the diff
   */
  const diffForFile = async (filename: string) => {
    const structuredDiff = await structuredDiffForFile(filename)

    if (!structuredDiff) {
      return null
    }

    const allLines = structuredDiff.chunks
      .map((c: { changes: Changes }) => c.changes)
      .reduce((a: Changes, b: Changes) => a.concat(b), [])

    return {
      before: await config.getFileContents(filename, config.repo, config.baseSHA),
      after: await config.getFileContents(filename, config.repo, config.headSHA),

      diff: allLines.map(getContent).join(os.EOL),

      added: allLines
        .filter(byType("add"))
        .map(getContent)
        .join(os.EOL),

      removed: allLines
        .filter(byType("del"))
        .map(getContent)
        .join(os.EOL),
    }
  }

  return {
    base: config.baseSHA,
    head: config.headSHA,
    fileMatch: chainsmoker({
      modified: gitJSONRep.modified_files,
      created: gitJSONRep.created_files,
      deleted: gitJSONRep.deleted_files,
      edited: gitJSONRep.modified_files.concat(gitJSONRep.created_files),
    }),
    modified_files: gitJSONRep.modified_files,
    created_files: gitJSONRep.created_files,
    deleted_files: gitJSONRep.deleted_files,
    commits: gitJSONRep.commits,
    diffForFile,
    structuredDiffForFile,
    JSONPatchForFile,
    JSONDiffForFile,
    linesOfCode,
  }
}
