import { DangerResults } from "../../dsl/DangerResults"
import { Violation } from "../../dsl/Violation"
import {
  dangerIDToString,
  messageForResultWithIssues,
  dangerSignature,
  noEntryEmoji,
  warningEmoji,
  messageEmoji,
} from "./bitbucketTemplateCommon"

/**
 * Converts a set of violations into a Markdown section
 *
 * @param {string} name User facing title of section
 * @param {string} emoji Emoji name to show
 * @param {Violation[]} violations for section
 * @returns {string} Markdown
 */
function resultsSection(name: string, emoji: string, violations: Violation[]): string {
  if (violations.length === 0 || violations.every(violation => !violation.message)) {
    return ""
  }
  return (
    `\n` +
    `| ${emoji} | ${name}\n` +
    `| --- | --- |\n` +
    `\n` +
    violations
      .map(v => {
        return (
          "> " +
          v.message
            .replace(/<\/?code>/g, "`")
            .split("\n")
            .join("\n> ")
        )
      })
      .join("\n\n") +
    `\n`
  )
}

/**
 * Postfix signature to be attached comment generated / updated by danger.
 */
export const dangerSignaturePostfix = (results: DangerResults, commitID?: string) => {
  let signature = dangerSignature(results)
  if (commitID !== undefined) {
    signature = `${signature} against ${commitID}`
  }
  return `
|    |
|---:|
| _${signature}_ |
`
}

/**
 * A template function for creating a GitHub issue comment from Danger Results
 * @param {string} dangerID A string that represents a unique build
 * @param {DangerResults} results Data to work with
 * @param {string} commitID The hash that represents the latest commit
 * @returns {string} HTML
 */
export function template(dangerID: string, results: DangerResults, commitID?: string): string {
  return `
${messageForResultWithIssues}

${resultsSection("Fails", noEntryEmoji, results.fails)}
${resultsSection("Warnings", warningEmoji, results.warnings)}
${resultsSection("Messages", messageEmoji, results.messages)}

${results.markdowns.map(v => v.message).join("\n\n")}

${dangerSignaturePostfix(results, commitID)}

[](http://${dangerIDToString(dangerID)})
`
}
