import { MessagingOptions } from "../../runner/Dangerfile"

/**
 * The result of user doing warn, message or fail.
 */
export interface Violation {
  /**
   * The string representation
   *
   * @type {string}
   */
  message: string

  options?: MessagingOptions
}
