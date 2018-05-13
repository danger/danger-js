import {
  emptyResults,
  failsResultsWithoutMessages,
  warnResults,
  failsResults,
  summaryResults,
  messagesResults,
  markdownResults,
  inlineRegularResults,
  inlineRegularResultsForTheSameLine,
} from "../../_tests/fixtures/ExampleDangerResults"
import {
  template as githubResultsTemplate,
  inlineTemplate as githubResultsInlineTemplate,
} from "../../templates/githubIssueTemplate"

describe("generating messages", () => {
  it("shows no tables for empty results", () => {
    const issues = githubResultsTemplate("blankID", emptyResults)
    expect(issues).not.toContain("Fails")
    expect(issues).not.toContain("Warnings")
    expect(issues).not.toContain("Messages")
  })

  it("shows no tables for results without messages", () => {
    const issues = githubResultsTemplate("blankID", failsResultsWithoutMessages)
    expect(issues).not.toContain("Fails")
    expect(issues).not.toContain("Warnings")
    expect(issues).not.toContain("Messages")
  })

  it("Shows the failing messages in a table", () => {
    const issues = githubResultsTemplate("blankID", failsResults)
    expect(issues).toContain("Fails")
    expect(issues).not.toContain("Warnings")
  })

  it("Shows the warning messages in a table", () => {
    const issues = githubResultsTemplate("blankID", warnResults)
    expect(issues).toContain("Warnings")
    expect(issues).not.toContain("Fails")
  })

  it("does not break commonmark rules around line breaks", () => {
    const issues = githubResultsTemplate("blankID", warnResults)
    expect(issues).not.toMatch(/(\r?\n){2}[ \t]+</)
  })

  it("Should include summary on top of message", () => {
    const issues = githubResultsTemplate("blankID", summaryResults)
    const expected = `
<!--
  1 failure:  Failing message F...
  1 warning:  Warning message W...
  1 messages
  1 markdown notices
  DangerID: danger-id-blankID;
-->`

    expect(issues).toContain(expected)
  })

  it("leaves space between <td>s to allow GitHub to render message content as markdown", () => {
    const issues = githubResultsTemplate("example-id", {
      fails: [{ message: "**Failure:** Something failed!" }],
      warnings: [{ message: "_Maybe you meant to run `yarn install`?_" }],
      messages: [{ message: "```ts\nfunction add(a: number, b: number): number {\n  return a + b\n}\n```" }],
      markdowns: [{ message: "List of things:\n\n* one\n* two\n* three\n" }],
    })

    expect(issues).toMatchSnapshot()
  })
})

describe("generating inline messages", () => {
  it("Shows the failing message", () => {
    const issues = githubResultsInlineTemplate("blankID", failsResults, "File.swift", 10)
    expect(issues).toContain("- :no_entry_sign: Failing message")
    expect(issues).not.toContain("- :warning:")
    expect(issues).not.toContain("- :book:")
  })

  it("Shows the warning message", () => {
    const issues = githubResultsInlineTemplate("blankID", warnResults, "File.swift", 10)
    expect(issues).toContain("- :warning: Warning message")
    expect(issues).not.toContain("- :no_entry_sign:")
    expect(issues).not.toContain("- :book:")
  })

  it("Shows the message", () => {
    const issues = githubResultsInlineTemplate("blankID", messagesResults, "File.swift", 10)
    expect(issues).toContain("- :book: Message")
    expect(issues).not.toContain("- :no_entry_sign:")
    expect(issues).not.toContain("- :warning:")
  })

  it("Should include summary on top of message", () => {
    const issues = githubResultsInlineTemplate("blankID", summaryResults, "File.swift", 10)
    const expected = `
<!--
  1 failure:  Failing message F...
  1 warning:  Warning message W...
  1 messages
  1 markdown notices
  DangerID: danger-id-blankID;
  File: File.swift;
  Line: 10;
-->`

    expect(issues).toContain(expected)
  })

  it("Shows markdowns one after another", () => {
    const issues = githubResultsInlineTemplate("blankID", markdownResults, "File.swift", 10)
    const expected = `
### Short Markdown Message1

### Short Markdown Message2
`
    expect(issues).toContain(expected)
  })

  it("Shows correct messages for inline/regular violations", () => {
    const issues = githubResultsTemplate("blankID", inlineRegularResults)

    expect(issues).toMatchSnapshot()
  })

  it("Shows correct message for multiple inline violations for the same file and line", () => {
    const issues = githubResultsInlineTemplate("blankID", inlineRegularResultsForTheSameLine, "File.swift", 10)

    expect(issues).toMatchSnapshot()
  })
})
