import dts from "./danger-dts"
import * as fs from "fs"

// This could need to exist
if (!fs.existsSync("distribution")) {
  fs.mkdirSync("distribution")
}

const output = dts()

// This is so you can get it for this repo 👍
fs.writeFileSync("source/danger.d.ts", output)
fs.writeFileSync("distribution/danger.d.ts", output)
fs.writeFileSync("types/index.d.ts", output)

console.log("Awesome - shipped to source/danger.d.ts, distribution/danger.d.ts and types/index.d.ts")
