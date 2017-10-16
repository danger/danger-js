import { Violation } from "../dsl/Violation"
import { MarkdownString } from "../dsl/Aliases"

/**
 * The representation of what running a Dangerfile generates.
 *
 * In the future I'd like this to be cross process, so please
 * do not add functions, only data to this interface.
 */
export interface DangerResults {
  /**
   * Failed messages
   */
  fails: Violation[]

  /**
   * Messages for info
   */
  warnings: Violation[]

  /**
   * A set of messages to show inline
   */
  messages: Violation[]

  /**
   * Markdown messages to attach at the bottom of the comment
   */
  markdowns: MarkdownString[]
}

export interface DangerRuntimeContainer extends DangerResults {
  /**
   * Asynchronous functions to be run after parsing
   */
  scheduled: any[]
}
