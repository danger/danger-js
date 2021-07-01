import { debug } from "../../debug"
import { exec } from "child_process"

const d = debug("localGetHeadSHA")

export const localGetHeadSHA = () =>
  new Promise<string>(done => {
    const call = `git rev-parse HEAD"`
    d(call)

    exec(call, (err, stdout, _stderr) => {
      if (err) {
        console.error(`Could not get the git HEAD for the current path]`)
        console.error(err)
        return
      }

      done(stdout.trim())
    })
  })
