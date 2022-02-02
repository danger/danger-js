/* eslint-disable no-var */
// This dangerfile is for running as an integration test on CI

import { DangerDSLType } from "../../../dsl/DangerDSL"
declare var danger: DangerDSLType
declare function markdown(params: string): void

const showArray = (array: any[], mapFunc?: (a: any) => any) => {
  const defaultMap = (a: any) => a
  const mapper = mapFunc || defaultMap
  return `\n - ${array.map(mapper).join("\n - ")}\n`
}

const git = danger.git

const goAsync = async () => {
  const firstFileDiff = await git.diffForFile(git.modified_files[0])
  const firstJSONFile = git.modified_files.find(f => f.endsWith("json"))
  const jsonDiff = firstJSONFile && (await git.JSONDiffForFile(firstJSONFile))
  const jsonDiffKeys = jsonDiff && showArray(Object.keys(jsonDiff))

  markdown(`
created: ${showArray(git.created_files)}
modified: ${showArray(git.modified_files)}
deleted: ${showArray(git.deleted_files)}
commits: ${git.commits.length}
messages: ${showArray(git.commits, c => c.message)}
diffForFile keys:${firstFileDiff && showArray(Object.keys(firstFileDiff))}
jsonDiff keys:${jsonDiffKeys || "no JSON files in the diff"}
`)
}
goAsync()
