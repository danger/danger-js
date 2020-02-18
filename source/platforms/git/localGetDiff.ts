import { debug } from "../../debug"
import { spawn } from "child_process"

const d = debug("localGetDiff")
const useCommittedDiffArgs = (base: string, head: string) => ["diff", `${base}...${head}`]
const useStagingChanges = (base: string) => ["diff", base]
export const localGetDiff = (base: string, head: string, staging: boolean = false) =>
  new Promise<string>(done => {
    const args = staging ? useStagingChanges(base) : useCommittedDiffArgs(base, head)
    let stdout = ""

    const child = spawn("git", args, { env: process.env })
    d("> git", args.join(" "))

    child.stdout.on("data", chunk => {
      stdout += chunk
    })

    child.stderr.on("data", data => {
      console.error(`Could not get diff from git between ${base} and ${head}`)
      throw new Error(data.toString())
    })

    child.on("close", function(code) {
      if (code === 0) {
        done(stdout)
      }
    })
  })
