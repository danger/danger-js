import { existsSync } from "fs"
import { cwd } from "process"

/**
 * Returns a the typical Dangerfile, depending on it's location
 * taking into account whether it JS or TS by whether those exists.
 *
 * Will throw if it isn't found.
 */
export function dangerfilePath(program: any): string {
  if (program.dangerfile) {
    return program.dangerfile
  }


  if (existsSync("dangerfile.mts")) {
    return "dangerfile.mts"
  }

  if (existsSync("dangerfile.mjs")) {
    return "dangerfile.mjs"
  }

  if (existsSync("dangerfile.ts")) {
    return "dangerfile.ts"
  }

  if (existsSync("dangerfile.js")) {
    return "dangerfile.js"
  }

  if (existsSync("Dangerfile.mts")) {
    return "Dangerfile.mts"
  }

  if (existsSync("Dangerfile.mjs")) {
    return "Dangerfile.mjs"
  }

  if (existsSync("Dangerfile.ts")) {
    return "Dangerfile.ts"
  }

  if (existsSync("Dangerfile.js")) {
    return "Dangerfile.js"
  }

  throw new Error(`Could not find a 'dangerfile.js' or 'dangerfile.ts' in the current working directory (${cwd()}).`)
}
