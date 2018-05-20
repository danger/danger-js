import { debug } from "../../debug"
import { exec } from "child_process"

const d = debug("localGetDiff")

export const localGetDiff = (base: string, head: string) =>
  new Promise<string>(done => {
    const call = `git diff ${base}...${head}`
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
