import {
  emptyResults,
  failsResultsWithoutMessages,
  warnResults,
  failsResults,
  summaryResults,
  messagesResults,
  markdownResults,
} from "../../_tests/fixtures/ExampleDangerResults"
import { template, inlineTemplate } from "../bitbucketServerTemplate"

describe("generating messages for BitBucket server", () => {
  it("shows no sections for empty results", () => {
    const issues = template("blankID", emptyResults)
    expect(issues).not.toContain("Fails")
    expect(issues).not.toContain("Warnings")
    expect(issues).not.toContain("Messages")
  })

  it("shows no sections for results without messages", () => {
    const issues = template("blankID", failsResultsWithoutMessages)
    expect(issues).not.toContain("Fails")
    expect(issues).not.toContain("Warnings")
    expect(issues).not.toContain("Messages")
  })

  it("Shows the failing messages in a section", () => {
    const issues = template("blankID", failsResults)
    expect(issues).toContain("Fails")
    expect(issues).not.toContain("Warnings")
  })

  it("Shows the warning messages in a section", () => {
    const issues = template("blankID", warnResults)
    expect(issues).toContain("Warnings")
    expect(issues).not.toContain("Fails")
  })

  it("summary result matches snapshot", () => {
    expect(template("blankID", summaryResults)).toMatchSnapshot()
  })
})

describe("generating inline messages", () => {
  it("Shows the failing message", () => {
    const issues = inlineTemplate(failsResults)
    expect(issues).toContain("- :no_entry_sign: Failing message")
    expect(issues).not.toContain("- :warning:")
    expect(issues).not.toContain("- :book:")
  })

  it("Shows the warning message", () => {
    const issues = inlineTemplate(warnResults)
    expect(issues).toContain("- :warning: Warning message")
    expect(issues).not.toContain("- :no_entry_sign:")
    expect(issues).not.toContain("- :book:")
  })

  it("Shows the message", () => {
    const issues = inlineTemplate(messagesResults)
    expect(issues).toContain("- :book: Message")
    expect(issues).not.toContain("- :no_entry_sign:")
    expect(issues).not.toContain("- :warning:")
  })

  it("Shows markdowns one after another", () => {
    const issues = inlineTemplate(markdownResults)
    const expected = `
### Short Markdown Message1

### Short Markdown Message2
`
    expect(issues).toContain(expected)
  })
})
