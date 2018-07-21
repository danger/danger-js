import * as parseDiff from "parse-diff"
import * as includes from "lodash.includes"
import { GitCommit } from "../../dsl/Commit"
import { GitJSONDSL } from "../../dsl/GitDSL"

/**
 * This function is essentially a "go from a diff to some simple structured data"
 * it's the steps needed for danger process.
 */

export const diffToGitJSONDSL = (diff: string, commits: GitCommit[]): GitJSONDSL => {
  const fileDiffs: any[] = parseDiff(diff)

  const addedDiffs = fileDiffs.filter((diff: any) => diff["new"])
  const removedDiffs = fileDiffs.filter((diff: any) => diff["deleted"])
  const modifiedDiffs = fileDiffs.filter((diff: any) => !includes(addedDiffs, diff) && !includes(removedDiffs, diff))

  return {
    modified_files: modifiedDiffs.map(d => d.to),
    created_files: addedDiffs.map(d => d.to),
    deleted_files: removedDiffs.map(d => d.from),
    commits: commits,
  }
}
