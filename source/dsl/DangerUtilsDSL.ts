/**
 * The Danger Utils DSL contains utility functions
 * that are specific to universal Danger use-cases.
 */
export interface DangerUtilsDSL {

  /**
   * Creates an HTML link.
   *
   * @param {string} href The HTML link's destination
   * @param {string} text The HTML link's text
   * @returns {string} The HTML <a> tag
   */
  href(href: string, text: string): string

  /**
   * Converts an array of strings into a sentence.
   *
   * @param {Array<string>} array The array of strings
   * @returns {string} The sentence
   */
  sentence(array: Array<string>): string
}
