import { debug } from "../../debug"
import * as JSON5 from "json5"

import { spawn } from "child_process"
import { GitCommit } from "../../dsl/Commit"

const d = debug("localGetDiff")

const sha = "%H"
const parents = "%p"
const authorName = "%an"
const authorEmail = "%ae"
const authorDate = "%ai"
const committerName = "%cn"
const committerEmail = "%ce"
const committerDate = "%ci"
const message = "%f" // this is subject, not message, so it'll only be one line

const author = `"author": {"name": "${authorName}", "email": "${authorEmail}", "date": "${authorDate}" }`
const committer = `"committer": {"name": "${committerName}", "email": "${committerEmail}", "date": "${committerDate}" }`
export const formatJSON = `{ "sha": "${sha}", "parents": "${parents}", ${author}, ${committer}, "message": "${message}"},`
export type localCommitOptions = {
  filePath?: string
  timeAgo?: string // e.g. 3.weeks
}

export const localGetCommits = (base: string, head: string, options: localCommitOptions = {}) =>
  new Promise<GitCommit[]>(done => {
    const { filePath, timeAgo } = options
    const commitsFrom = filePath ? `-- ${filePath}` : `${base}...${head}`
    const sinceWhen = timeAgo ? `--since=${timeAgo}` : ""
    const args = ["log", commitsFrom, `--pretty=format:${formatJSON}`, sinceWhen].filter(arg => arg && arg.length)
    const child = spawn("git", args, { env: process.env })
    d("> git", args.join(" "))
    child.stdout.on("data", async data => {
      data = data.toString()

      // remove trailing comma, and wrap into an array
      const asJSONString = `[${data.substring(0, data.length - 1)}]`
      const commits = JSON5.parse(asJSONString)
      const realCommits = commits.map((c: any) => ({
        ...c,
        parents: c.parents.split(" "),
      }))

      done(realCommits)
    })

    child.stderr.on("data", data => {
      console.error(`Could not get commits from git from ${commitsFrom}`)
      throw new Error(data.toString())
    })
  })
