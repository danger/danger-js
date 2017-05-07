/**
 * The Danger Utils DSL contains utility functions
 * that are specific to universal Danger use-cases.
 */
export interface DangerUtilsDSL {

  /**
   * Creates a link using HTML.
   *
   * If `href` and `text` are falsy, null is returned.
   * If `href` is falsy and `text` is truthy, `text` is returned.
   * If `href` is truthy and `text` is falsy, an <a> tag is returned with `href` as its href and text value.
   * Otherwise, if `href` and `text` are truthy, an <a> tag is returned with the `href` and `text` inserted as expected.
   *
   * @param {string} href The HTML link's destination.
   * @param {string} text The HTML link's text.
   * @returns {string|null} The HTML <a> tag.
   */
  href(href: string, text: string): string | null

  /**
   * Converts an array of strings into a sentence.
   *
   * @param {string[]} array The array of strings.
   * @returns {string} The sentence.
   */
  sentence(array: string[]): string
}
