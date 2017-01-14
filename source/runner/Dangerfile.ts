import { DangerResults } from "../dsl/DangerResults"
import { DangerDSLType } from "../dsl/DangerDSL"
import { MarkdownString, Filename, LineNumber } from "../dsl/Aliases"

export interface DangerContext {
  /**
   * Fails a build, outputting a specific reason for failing
   *
   * @param {MarkdownString} message the String to output
   */
  fail(message: MarkdownString, options?: DangerOptions): void

  /**
   * Highlights low-priority issues, does not fail the build
   *
   * @param {MarkdownString} message the String to output
   */
  warn(message: MarkdownString, options?: DangerOptions): void

  /**
   * Puts a message inside the Danger table
   *
   * @param {MarkdownString} message the String to output
   */
  message(message: MarkdownString, options?: DangerOptions): void

  /**
   * Puts a message inside the Danger table
   *
   * @param {MarkdownString} message the String to output
   */
  markdown(message: MarkdownString, options?: DangerOptions): void

  /** Typical console */
  console: Console

  /**
   * The Danger object to work with
   *
   * @type {DangerDSLType}
   */
  danger: DangerDSLType
  /**
   * Results of a Danger run
   *
   * @type {DangerDSLType}
   */
  results: DangerResults
}

export interface DangerOptions {
  file?: Filename
  line?: LineNumber
}

/** Creates a Danger context, this provides all of the global functions
 *  which are available to the Danger eval runtime.
 *
 * @param {DangerDSLType} dsl The DSL which is turned into `danger`
 * @returns {DangerContext} a DangerContext-like API
 */
export function contextForDanger(dsl: DangerDSLType): DangerContext {
  const results: DangerResults = {
    fails: [],
    warnings: [],
    messages: [],
    markdowns: []
  }

  const fail = (message: MarkdownString, options: DangerOptions = {}) => results.fails.push({ message, options })
  const warn = (message: MarkdownString, options: DangerOptions = {}) => results.warnings.push({ message, options })
  const message = (message: MarkdownString, options: DangerOptions = {}) => results.messages.push({ message, options })
  const markdown = (message: MarkdownString, options: DangerOptions = {}) => results.markdowns.push({ message, options })

  return {
    fail,
    warn,
    message,
    markdown,
    console,
    results,
    danger: dsl
  }
}
