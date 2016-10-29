// https://nodejs.org/api/vm.html
// https://60devs.com/executing-js-code-with-nodes-vm-module.html

import fs from "fs"
import vm from "vm"
import DangerDSL from "../dsl/DangerDSL"
import type { Violation } from "../platforms/messaging/violation"

export interface DangerResults {
  fails: Violation[]
}

export default class Dangerfile {
  dsl: DangerDSL

  constructor(dsl: DangerDSL) {
    this.dsl = dsl
    this.failed = false
    this.fails = []
  }

  async run(file: string): Promise<DangerResults> {
    const contents = await this.readFile(file)

    // comment out imports of 'danger'
    // e.g `import danger from`
    // then user get typed data, and we fill it in
    // via the VM context

    const cleaned = contents
      .replace(/import danger /gi, "// import danger ")
      .replace(/import { danger/gi, "// import { danger ")

    const script = new vm.Script(cleaned, {
      filename: file,
      lineOffset: 1,
      columnOffset: 1,
      displayErrors: true,
      timeout: 1000 // ms
    })

    const results = {
      fails: []
    }

    const fail = (message: string) => {
      results.fails.push({ message })
    }

    const context: any = {
      fail,
      console,
      danger: this.dsl
    }

    script.runInNewContext(context)
    return results
  }

  readFile(path: String): Promise<string> {
    return new Promise((resolve: any, reject: any) => {
      fs.readFile(path, "utf8", (err: Error, data: string) => {
        if (err) {
          console.error("Error: " + err.message)
          process.exitCode = 1
          return reject(err)
        }
        resolve(data)
      })
    })
  }
}

