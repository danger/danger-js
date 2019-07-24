import { DangerResults } from "../../dsl/DangerResults"
import { Violation } from "../../dsl/Violation"
import { dangerIDToString, messageForResultWithIssues, dangerSignature } from "./bitbucketTemplateCommon"
import { compliment } from "../DangerUtils"

// BitBucket Cloud supports these emojis 🎉
const noEntryEmoji = "❌"
const warningEmoji = "⚠️"
const messageEmoji = "✨"
const signatureEmoji = "🚫"
const successEmoji = "🎉"
/**
 * Postfix signature to be attached comment generated / updated by danger.
 */
export const dangerSignaturePostfix = (results: DangerResults, commitID?: string) => {
  let signature = dangerSignature(results, signatureEmoji)
  if (commitID !== undefined) {
    signature = `${signature} against ${commitID}`
  }
  return `

  ${signature}
  `
}

function buildMarkdownTable(header: string, defaultEmoji: string, violations: Violation[]): string {
  if (violations.length === 0 || violations.every(violation => !violation.message)) {
    return ""
  }
  return `

  |      ${violations.length} ${header} |
  | --- |
${violations.map(v => `  | ${v.icon || defaultEmoji} - ${v.message} |`).join("\n")}

  `
}

/**
 * A template function for creating a GitHub issue comment from Danger Results
 * @param {string} dangerID A string that represents a unique build
 * @param {string} commitID The hash that represents the latest commit
 * @param {DangerResults} results Data to work with
 * @returns {string} HTML
 */
export function template(dangerID: string, results: DangerResults, commitID?: string): string {
  let summaryMessage: string
  if (!results.fails.length && !results.warnings.length) {
    summaryMessage = `${successEmoji}  All green. ${compliment()}`
  } else {
    summaryMessage = messageForResultWithIssues
  }
  return `
  ${summaryMessage}

  ${buildMarkdownTable("Fails", noEntryEmoji, results.fails)}
  ${buildMarkdownTable("Warnings", warningEmoji, results.warnings)}
  ${buildMarkdownTable("Messages", messageEmoji, results.messages)}
  
  ${results.markdowns.map(v => v.message).join("\n\n")}
  
  ${dangerSignaturePostfix(results, commitID)}
  
  [](http://${dangerIDToString(dangerID)})
  `
}
