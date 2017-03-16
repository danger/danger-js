import { existsSync } from "fs"

/**
 * Returns a the typical Dangerfile, depending on it's location
 * taking into account whether it JS or TS by whether those exists.
 *
 * Will throw if it isn't found.
 */
export function dangerfilePath(program: any): string {
  if (program.dangerfile) { return program.dangerfile }
  if (existsSync("dangerfile.js")) { return "dangerfile.js" }
  if (existsSync("dangerfile.ts")) { return "dangerfile.ts" }

  throw new Error("Could not find a `dangerfile.js` or `dangerfile.ts` in the current working directory.")
}
