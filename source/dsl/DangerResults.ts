import { Violation } from "../platforms/messaging/violation"
import { MarkdownString } from "../dsl/Aliases"

/**
 * Representation of what running a Dangerfile generates.
 * In the future I'd like this to be cross process, so please
 * do not add functions, only data to this interface.
 */
export interface DangerResults {

  /**
   * Failed messages
   * @type {Violation[]}
   */
  fails: Violation[]

  /**
   * Messages for info
   * @type {Violation[]}
   */
  warnings: Violation[]

  /**
   * Markdown messages
   * @type {Violation[]}
   */
  messages: Violation[]

  /**
   * Markdown messages at the bottom of the comment
   * @type {MarkdownString[]}
   */
  markdowns: MarkdownString[]
}

export interface DangerRuntimeContainer extends DangerResults {
  /**
   * Asynchronous functions to be run after parsing
   * @type {Function[]}
   */
  scheduled: Function[]
}
