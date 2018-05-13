/**
 * The result of user doing warn, message or fail, built this way for
 * expansion later.
 */
export interface Violation {
  /**
   * The string representation
   *
   * @type {string}
   */
  message: string

  /**
   * Optional path to the file
   * @type {string}
   */
  file?: string

  /**
   * Optional line in the file
   * @type {string}
   */
  line?: number
}

/// End of Danger DSL definition

export const isInline = (violation: Violation): boolean => violation.file !== undefined && violation.line !== undefined
