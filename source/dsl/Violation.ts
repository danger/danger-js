// Please don't have includes in here that aren't inside the DSL folder, or the d.ts/flow defs break

/**
 * The result of user doing warn, message or fail, built this way for
 * expansion later.
 */
export interface Violation {
  /** The string representation */
  message: string

  /** Optional path to the file */
  file?: string

  /** Optional line in the file */
  line?: number
}

/// End of Danger DSL definition

export const isInline = (violation: Violation): boolean => violation.file !== undefined && violation.line !== undefined
