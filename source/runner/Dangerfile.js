// @flow

import type { DangerResults } from "./DangerResults"
import type { DangerDSLType } from "../dsl/DangerDSL"
import type { MarkdownString } from "../dsl/Aliases"

export interface DangerContext {
/* BEGIN FLOWTYPE EXPORT */
  /**
   * Fails a build, outputting a specific reason for failing
   *
   * @param {MarkdownString} message the String to output
   */
  fail(message: MarkdownString): void;

  /**
   * Highlights low-priority issues, does not fail the build
   *
   * @param {MarkdownString} message the String to output
   */
  warn(message: MarkdownString): void;

  /**
   * Puts a message inside the Danger table
   *
   * @param {MarkdownString} message the String to output
   */
  message(message: MarkdownString): void;

  /**
   * Puts a message inside the Danger table
   *
   * @param {MarkdownString} message the String to output
   */
  markdown(message: MarkdownString): void;

  /** Typical console */
  console: any;

  /**
   * The Danger object to work with
   *
   * @type {DangerDSLType}
   */
  danger: DangerDSLType;
  /**
   * Results of a Danger run
   *
   * @type {DangerDSLType}
   */
  results: DangerResults;
/* END FLOWTYPE EXPORT */
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

  const fail = (message: MarkdownString) => {
    results.fails.push({ message })
  }

  const warn = (message: MarkdownString) => {
    results.warnings.push({ message })
  }

  const message = (message: MarkdownString) => {
    results.messages.push({ message })
  }

  const markdown = (message: MarkdownString) => {
    results.markdowns.push(message)
  }

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
