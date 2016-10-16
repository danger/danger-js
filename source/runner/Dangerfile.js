// https://nodejs.org/api/vm.html
// https://60devs.com/executing-js-code-with-nodes-vm-module.html

import fs from "fs"
import vm from "vm"
import DangerDSL from "../dsl/DangerDSL"

export default class Dangerfile {
  dsl: DangerDSL
  constructor(dsl: DangerDSL) { this.dsl = dsl }

  run(file: string) {
    fs.readFile(file, "utf8", (err: Error, data: string) => {
      if (err) { return console.error(err.message) }

      // comment out imports of 'danger'
      // e.g `import danger from`
      // then user get typed data, and we fill it in
      // via the VM context

      const cleaned = data.replace(/import danger from/gi, "// import danger from")

      const script = new vm.Script(cleaned, {
        filename: file,
        lineOffset: 1,
        columnOffset: 1,
        displayErrors: true,
        timeout: 1000 // ms
      })

      const context: any = {
        console,
        danger: this.dsl
      }

      script.runInNewContext(context)
    })
  }
}

