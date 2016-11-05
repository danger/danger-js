// @flow
import type { Violation } from "../platforms/messaging/violation"

export type MarkdownString = string;

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
  fails: Violation[],

  /**
   * Messages for info
   * @type {Violation[]}
   */
  warnings: Violation[],

  /**
   * Markdown messages
   * @type {Violation[]}
   */
  messages: Violation[],

  /**
   * Markdown messages at the bottom of the comment
   * @type {MarkdownString[]}
   */
  markdowns: MarkdownString[]
}
