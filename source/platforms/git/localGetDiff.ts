import * as debug from "debug"
import { exec } from "child_process"

const d = debug("danger:localGetDiff")

export const localGetDiff = (base: string, head: string) =>
  new Promise<string>(done => {
    const call = `git diff --no-index ${base} ${head}`
    d(call)

    exec(call, (err, stdout, _stderr) => {
      if (err) {
        console.error(`Could not get diff from git between ${base} and ${head}`)
        console.error(err)
        return
      }

      done(stdout)
    })
  })
