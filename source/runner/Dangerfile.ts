import { DangerRuntimeContainer } from "../dsl/DangerResults"
import { DangerDSLType } from "../dsl/DangerDSL"
import { MarkdownString } from "../dsl/Aliases"

/// Start of Danger DSL definition

export interface DangerContext {
  /**
   * Contains asynchronous code to be run after the application has booted.
   *
   * @param {Function} asyncFunction the function to run asynchronously
   */
  schedule(asyncFunction: (p: Promise<any>) => void): void

  /**
   * Fails a build, outputting a specific reason for failing
   *
   * @param {MarkdownString} message the String to output
   */
  fail(message: MarkdownString): void

  /**
   * Highlights low-priority issues, does not fail the build
   *
   * @param {MarkdownString} message the String to output
   */
  warn(message: MarkdownString): void

  /**
   * Puts a message inside the Danger table
   *
   * @param {MarkdownString} message the String to output
   */
  message(message: MarkdownString): void

  /**
   * Puts a message inside the Danger table
   *
   * @param {MarkdownString} message the String to output
   */
  markdown(message: MarkdownString): void

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
  results: DangerRuntimeContainer
}

/// End of Danger DSL definition

/** Creates a Danger context, this provides all of the global functions
 *  which are available to the Danger eval runtime.
 *
 * @param {DangerDSLType} dsl The DSL which is turned into `danger`
 * @returns {DangerContext} a DangerContext-like API
 */
export function contextForDanger(dsl: DangerDSLType): DangerContext {
  const results: DangerRuntimeContainer = {
    fails: [],
    warnings: [],
    messages: [],
    markdowns: [],
    scheduled: [],
  }

  const schedule = (fn: Function) => results.scheduled.push(fn)
  const fail = (message: MarkdownString) => results.fails.push({ message })
  const warn = (message: MarkdownString) => results.warnings.push({ message })
  const message = (message: MarkdownString) => results.messages.push({ message })
  const markdown = (message: MarkdownString) => results.markdowns.push(message)

  // Anything _but_ danger, that is on the root-level DSL
  const globals = {
    schedule,
    fail,
    warn,
    message,
    markdown,
    console,
    results,
  }

  // OK, so this is a bit weird, but hear me out.
  //
  // I am not sure if it makes sense for "danger js plugins" ( which will
  // be normal npm modules) to work with the magic globals available in the runtime.
  //
  // So I'm _probably_ going to advocate that you pass in the `danger` object into
  // functions for danger plugins. This means that they can use `danger.fail` etc. This
  // should make it significantly easier to build and make tests for your modules.
  //
  // Which should mean we get more plugins overall.
  //
  // Which should be cool.
  //
  // So, I'm not going to expose these on the interfaces (and thus the public reference
  // but it will go into a 'plugin authors guide' whatever that looks like.)
  //
  return {
    ...globals,
    danger: {
      ...dsl,
      ...globals,
    },
  }
}
