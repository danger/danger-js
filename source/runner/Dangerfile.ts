import { DangerRuntimeContainer } from "../dsl/DangerResults"
import { DangerDSLType, PerilDSL } from "../dsl/DangerDSL"
import { MarkdownString } from "../dsl/Aliases"

/// Start of Danger DSL definition

/** A function with a callback function, which Danger wraps in a Promise */
export type CallbackableFn = (callback: (done: any) => void) => void

/**
 * Types of things which Danger will schedule for you, it's recommended that you
 * just throw in an `async () => { [...] }` function. Can also handle a function
 * that has a single 'done' arg.
 */
export type Scheduleable = Promise<any> | Promise<void> | CallbackableFn

export interface DangerContext {
  /**
   * A Dangerfile, in Peril, is evaluated as a script, and so async code does not work
   * out of the box. By using the `schedule` function you can now register a
   * section of code to evaluate across multiple tick cycles.
   *
   * `schedule` currently handles two types of arguments, either a promise or a function with a resolve arg.
   *
   * @param {Function} asyncFunction the function to run asynchronously
   */
  schedule(asyncFunction: Scheduleable): void

  /**
   * Fails a build, outputting a specific reason for failing into a HTML table.
   *
   * @param {MarkdownString} message the String to output
   * @param {string | undefined} file a file which this message should be attached to
   * @param {number | undefined} line the line which this message should be attached to
   */
  fail(message: MarkdownString, file?: string, line?: number): void

  /**
   * Highlights low-priority issues, but does not fail the build. Message
   * is shown inside a HTML table.
   *
   * @param {MarkdownString} message the String to output
   * @param {string | undefined} file a file which this message should be attached to
   * @param {number | undefined} line the line which this message should be attached to
   */
  warn(message: MarkdownString, file?: string, line?: number): void

  /**
   * Adds a message to the Danger table, the only difference between this
   * and warn is the emoji which shows in the table.
   *
   * @param {MarkdownString} message the String to output
   * @param {string | undefined} file a file which this message should be attached to
   * @param {number | undefined} line the line which this message should be attached to
   */
  message(message: MarkdownString, file?: string, line?: number): void
  /**
   * Adds a message to the Danger table, the only difference between this
   * and warn is the default emoji which shows in the table.
   * You can also specifiy a custom emoji to show in the table for each message
   * 
   * @param {MarkdownString} message the String to output
   * @param {{file?: string, line?: string, icon?: MarkdownString}} [opts]
   * @param opts.file a file which this message should be attached to
   * @param opts.line the line which this message should be attached to
   * @param opts.icon icon string or image to show in table, take care not to break table formatting
   */
  message(message: MarkdownString, opts?: { file?: string, line?: number, icon?: MarkdownString }): void

  /**
   * Adds raw markdown into the Danger comment, under the table
   *
   * @param {MarkdownString} message the String to output
   * @param {string | undefined} file a file which this message should be attached to
   * @param {number | undefined} line the line which this message should be attached to
   */
  markdown(message: MarkdownString, file?: string, line?: number): void

  /**
   * The root Danger object. This contains all of the metadata you
   * will be looking for in order to generate useful rules.
   */
  danger: DangerDSLType

  /**
   * When Peril is running your Dangerfile, the Danger DSL is
   * extended with additional options.
   */
  peril: PerilDSL

  /**
   * The current results of a Danger run, this can be useful if you
   * are wanting to introspect on whether a build has already failed.
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

  const schedule = (fn: any) => results.scheduled && results.scheduled.push(fn)
  const fail = (message: MarkdownString, file?: string, line?: number) => results.fails.push({ message, file, line })
  const warn = (message: MarkdownString, file?: string, line?: number) => results.warnings.push({ message, file, line })

  const message = (message: MarkdownString, opts?: string | { file?: string, line?: number, icon?: MarkdownString }, lineArg?: number) => {
    let file: string | undefined
    let line: number | undefined
    let icon: MarkdownString | undefined

    if (typeof opts === 'string') {
      file = opts
      line = lineArg
    }
    else if (typeof opts === 'object') {
      ({ file, line, icon } = opts)
    }

    results.messages.push({ message, file, line, icon })
  }
  const markdown = (message: MarkdownString, file?: string, line?: number) =>
    results.markdowns.push({ message, file, line })

  return {
    schedule,
    fail,
    warn,
    message,
    markdown,
    results,
    danger: dsl,
    peril: {} as any,
  }
}
