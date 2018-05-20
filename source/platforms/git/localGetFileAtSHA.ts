import { debug } from "../../debug"
import { exec } from "child_process"

const d = debug("localGetFileAtSHA")

export const localGetFileAtSHA = (path: string, _repo: string | undefined, sha: string) =>
  new Promise<string>(done => {
    const call = `git show ${sha}:"${path}"`
    d(call)

    exec(call, (err, stdout, _stderr) => {
      if (err) {
        console.error(`Could not get the file ${path} from git at ${sha}`)
        console.error(err)
        return
      }

      done(stdout)
    })
  })
