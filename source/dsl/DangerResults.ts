import { Violation } from "../platforms/messaging/violation"

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
  fails: Array<Violation>

  /**
   * Messages for info
   * @type {Violation[]}
   */
  warnings: Array<Violation>

  /**
   * Markdown messages
   * @type {Violation[]}
   */
  messages: Array<Violation>

  /**
   * Markdown messages at the bottom of the comment
   * @type {Violation[]}
   */
  markdowns: Array<Violation>
}
