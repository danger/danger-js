// Please don't have includes in here that aren't inside the DSL folder, or the d.ts/flow defs break

import { Violation, isInline } from "../dsl/Violation"

/**
 * The representation of what running a Dangerfile generates.
 * This needs to be passed between processes, so data only please.
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
  markdowns: Violation[]

  github?: {
    /**
     * Markdown text which gets added as a summary in the first
     * page which you see when you click through to the PR results.
     *
     * https://github.blog/2022-05-09-supercharging-github-actions-with-job-summaries/ */
    stepSummary?: string
  }

  /** Meta information about the runtime evaluation */
  meta?: {
    /** E.g. "dangerJS", or "Danger Swift" */
    runtimeName: string
    /** e.g. "https://danger.systems/js" */
    runtimeHref: string
  }
}

export interface DangerRuntimeContainer extends DangerResults {
  /**
   * Asynchronous functions to be run after parsing
   */
  scheduled?: any[]
}

export interface DangerInlineResults {
  /**
   * Path to the file
   */
  file: string

  /**
   * Line in the file
   */
  line: number

  /**
   * Failed messages
   */
  fails: string[]

  /**
   * Messages for info
   */
  warnings: string[]

  /**
   * A set of messages to show inline
   */
  messages: string[]

  /**
   * Markdown messages to attach at the bottom of the comment
   */
  markdowns: string[]
}

/// End of Danger DSL definition

export const emptyDangerResults = {
  fails: [],
  warnings: [],
  messages: [],
  markdowns: [],
}

export function validateResults(results: DangerResults) {
  // The data we get back is JSON sent by STDIN that can come from many
  // consumers, let's take the time to ensure the data is how we think it is.
  const { fails, warnings, messages, markdowns } = results
  const props = { fails, warnings, messages, markdowns }
  Object.keys(props).forEach((name) => {
    //
    // Must include the key 4 types
    if (!props[name]) {
      throw new Error(`Results passed to Danger JS did not include ${name}.\n\n${JSON.stringify(results, null, "  ")}`)
    }

    const violations: Violation[] = props[name]
    violations.forEach((v) => {
      // They should always have a message
      if (!v.message) {
        throw new Error(
          `A violation passed to Danger JS in ${name} did not include \`message\`.\n\n${JSON.stringify(v, null, "  ")}`
        )
      }
      // Warn if anything other than the initial API is on a violation
      const officialAPI = ["message", "line", "file", "icon"]
      const keys = Object.keys(v).filter((f) => !officialAPI.includes(f))
      if (keys.length) {
        console.warn(`Received unexpected key in Violation, expected only ${officialAPI} but got ${Object.keys(v)}`)
      }
    })
  })
}

/** Returns only the inline violations from Danger results */
export function inlineResults(results: DangerResults): DangerResults {
  return {
    fails: results.fails.filter((m) => isInline(m)),
    warnings: results.warnings.filter((m) => isInline(m)),
    messages: results.messages.filter((m) => isInline(m)),
    markdowns: results.markdowns.filter((m) => isInline(m)),
  }
}

/** Returns only the main-comment comments violations from Danger results */
export function regularResults(results: DangerResults): DangerResults {
  return {
    fails: results.fails.filter((m) => !isInline(m)),
    warnings: results.warnings.filter((m) => !isInline(m)),
    messages: results.messages.filter((m) => !isInline(m)),
    markdowns: results.markdowns.filter((m) => !isInline(m)),
    meta: results.meta,
    github: results.github,
  }
}

/** Concat all the violations into a new results */
export function mergeResults(results1: DangerResults, results2: DangerResults): DangerResults {
  return {
    fails: results1.fails.concat(results2.fails),
    warnings: results1.warnings.concat(results2.warnings),
    messages: results1.messages.concat(results2.messages),
    markdowns: results1.markdowns.concat(results2.markdowns),
    meta: results1.meta || results2.meta,
    github: results1.github || results2.github,
  }
}

/** Sorts all of the results according to their files and lines */
export function sortInlineResults(inlineResults: DangerInlineResults[]): DangerInlineResults[] {
  // First sort messages in every inline result
  const sortedInlineResults = inlineResults.map((i) => {
    return {
      file: i.file,
      line: i.line,
      fails: i.fails.sort(),
      warnings: i.warnings.sort(),
      messages: i.messages.sort(),
      markdowns: i.markdowns.sort(),
    }
  })

  // Then sort a whole array of inline results based on file/line
  return sortedInlineResults.sort((a, b) => {
    if (a.file < b.file) {
      return -1
    } else if (a.file > b.file) {
      return 1
    } else if (a.line < b.line) {
      return -1
    } else if (a.line > b.line) {
      return 1
    } else {
      // both file & line are the same
      return 0
    }
  })
}

export function sortResults(results: DangerResults): DangerResults {
  const sortByFile = (a: Violation, b: Violation): number => {
    if (a.file === undefined && b.file === undefined) {
      return 0;
    }
    if (a.file === undefined) {
      return -1
    }
    if (b.file === undefined) {
      return 1
    }

    if (a.file == b.file) {
      if (a.line === undefined && b.line === undefined) {
        return 0;
      }
      if (a.line === undefined) {
        return -1
      }
      if (b.line === undefined) {
        return 1
      }

      if (a.line < b.line) {
        return -1
      } else if (a.line > b.line) {
        return 1
      } else {
        return 0
      }
    }

    if (a.file < b.file) {
      return -1
    } else {
      return 1
    }
  }

  return {
    fails: results.fails.sort(sortByFile),
    warnings: results.warnings.sort(sortByFile),
    messages: results.messages.sort(sortByFile),
    markdowns: results.markdowns.sort(sortByFile),
    meta: results.meta,
    github: results.github,
  }
}

export const emptyResults = (): DangerResults => ({ fails: [], markdowns: [], warnings: [], messages: [] })

export const isEmptyResults = (results: DangerResults): boolean =>
  [...results.fails, ...results.warnings, ...results.messages, ...results.markdowns].length === 0

export const isMarkdownOnlyResults = (results: DangerResults): boolean =>
  results.markdowns.length > 0 && [...results.fails, ...results.warnings, ...results.messages].length === 0

export function resultsIntoInlineResults(results: DangerResults): DangerInlineResults[] {
  // Here we iterate through all keys ("fails", "warnings", "messages", "markdowns") and for each violation
  // in given kind we produce new DangerInlineResult or append a violation to existing result. This is all
  // happening in a `violationsIntoInlineResults` function that mutates an out-of-scope variable `dangerInlineResults`.

  const dangerInlineResults: DangerInlineResults[] = []

  const violationsIntoInlineResults = (kind: string) => {
    for (let violation of results[kind]) {
      if (violation.file && violation.line) {
        const findInlineResult = dangerInlineResults.find((r) => r.file == violation.file && r.line == violation.line)
        if (findInlineResult) {
          findInlineResult[kind].push(violation.message)
        } else {
          const inlineResult = {
            file: violation.file,
            line: violation.line,
            fails: [],
            warnings: [],
            messages: [],
            markdowns: [],
          }
          inlineResult[kind].push(violation.message)
          dangerInlineResults.push(inlineResult)
        }
      }
    }
  }
  Object.keys(results).forEach(violationsIntoInlineResults)

  return dangerInlineResults
}

export function inlineResultsIntoResults(inlineResults: DangerInlineResults): DangerResults {
  const messageToViolation = (message: string): Violation => {
    return { message: message, file: inlineResults.file, line: inlineResults.line }
  }

  return {
    fails: inlineResults.fails.map(messageToViolation),
    warnings: inlineResults.warnings.map(messageToViolation),
    messages: inlineResults.messages.map(messageToViolation),
    markdowns: inlineResults.markdowns.map(messageToViolation),
  }
}
