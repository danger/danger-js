// https://regex101.com/r/Jxa3KX/4
const requirePattern = /(const|let|var)(.|\n)*? require\(('|")danger('|")\);?$/gm
//  https://regex101.com/r/hdEpzO/3
const es6Pattern = /import((?!from)(?!require)(.|\n))*?(from|require\()\s?('|")danger('|")\)?;?$/gm

/**
 * This produces a closure that can be passed to string.replace
 * It preserves the passed in code, adding simple comments.
 *
 * This should keep line numbers the same when errors get thrown parsing dangerfiles!
 */
const nNewLinesReplacer = (comment: string) => (substring: string) =>
  substring
    .split("\n")
    .map((chunk, index) => {
      return index === 0 ? comment + " " + chunk : "// " + chunk
    })
    .join("\n")

const importReplacer = nNewLinesReplacer("// Removed" /* import will be the next word!*/)
const requireReplacer = nNewLinesReplacer("// Removed require; Original: ")

/**
 * Updates a Dangerfile to remove the import for Danger
 * @param {string} contents the file path for the dangerfile
 * @returns {string} the revised Dangerfile
 */
export default (contents: string): string =>
  contents.replace(es6Pattern, importReplacer).replace(requirePattern, requireReplacer)
