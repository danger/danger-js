import { debug } from "../../debug"
import { spawn } from "child_process"

const d = debug("localGetDiff")

export const localGetDiff = (base: string, head: string) =>
  new Promise<string>(done => {
    const args = ["diff", `${base}...${head}`]

    const child = spawn("git", args, { env: process.env })
    d("> git", args.join(" "))

    child.stdout.on("data", async data => {
      data = data.toString()
      done(data)
    })

    child.stderr.on("data", data => {
      console.error(`Could not get diff from git between ${base} and ${head}`)
      throw new Error(data.toString())
    })
  })
