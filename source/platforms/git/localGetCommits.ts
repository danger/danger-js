import { debug } from "../../debug"
import JSON5 from "json5"

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

export const localGetCommits = (base: string, head: string) =>
  new Promise<GitCommit[]>((resolve, reject) => {
    const args = ["log", `${base}...${head}`, `--pretty=format:${formatJSON}`]
    const child = spawn("git", args, { env: process.env })
    d("> git", args.join(" "))
    const commits: GitCommit[] = []

    child.stdout.on("data", async (chunk: Buffer) => {
      const data = chunk.toString()
      // remove trailing comma, and wrap into an array
      const asJSONString = `[${data.substring(0, data.length - 1)}]`
      const commits = JSON5.parse(asJSONString)
      const realCommits = commits.map((c: any) => ({
        ...c,
        parents: c.parents.split(" "),
      }))

      commits.push(...realCommits)
    })

    child.stderr.on("end", () => resolve(commits))

    const errorParts: string[] = []

    child.stderr.on("data", (chunk: Buffer) => errorParts.push(chunk.toString()))

    child.on("close", code => {
      if (code !== 0) {
        console.error(`Could not get commits from git between ${base} and ${head}`)
        reject(new Error(errorParts.join("")))
      } else {
        resolve(commits)
      }
    })
  })
