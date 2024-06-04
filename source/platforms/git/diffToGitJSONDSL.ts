import parseDiff from "parse-diff"
import includes from "lodash.includes"
import { GitCommit } from "../../dsl/Commit"
import { GitJSONDSL } from "../../dsl/GitDSL"

/**
 * This function is essentially a "go from a diff to some simple structured data"
 * it's the steps needed for danger process.
 */

export const diffToGitJSONDSL = (diff: string, commits: GitCommit[]): GitJSONDSL => {
  const fileDiffs: parseDiff.File[] = parseDiff(diff)

  const addedDiffs = fileDiffs.filter((diff: parseDiff.File) => diff.new == true) as any[]
  const removedDiffs = fileDiffs.filter((diff: parseDiff.File) => diff.deleted == true) as any[]
  const modifiedDiffs = fileDiffs.filter(
    (diff: any) => !includes(addedDiffs, diff) && !includes(removedDiffs, diff)
  ) as any[]

  return {
    //                                             Work around for danger/danger-js#807
    modified_files: modifiedDiffs.map((d) => d.to || (d.from && d.from.split(" b/")[0])),
    created_files: addedDiffs.map((d) => d.to),
    deleted_files: removedDiffs.map((d) => d.from),
    commits: commits,
  }
}
