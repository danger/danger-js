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

const noEntryEmoji = "\u274C"
const warningEmoji = "⚠️"
const messageEmoji = "\u2728"

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
    const issues = inlineTemplate("blankID", failsResults, "File.swift", 5)
    expect(issues).toContain("- ${noEntryEmoji} Failing message")
    expect(issues).not.toContain("- ${warningEmoji}")
    expect(issues).not.toContain("- ${messageEmoji}")
  })

  it("Shows the warning message", () => {
    const issues = inlineTemplate("blankID", warnResults, "File.swift", 5)
    expect(issues).toContain("- ${warningEmoji} Warning message")
    expect(issues).not.toContain("- ${noEntryEmoji}")
    expect(issues).not.toContain("- ${messageEmoji}")
  })

  it("Shows the message", () => {
    const issues = inlineTemplate("blankID", messagesResults, "File.swift", 5)
    expect(issues).toContain("- ${messageEmoji} Message")
    expect(issues).not.toContain("- ${noEntryEmoji}")
    expect(issues).not.toContain("- ${warningEmoji}")
  })

  it("Shows markdowns one after another", () => {
    const issues = inlineTemplate("blankID", markdownResults, "File.swift", 5)
    const expected = `
### Short Markdown Message1

### Short Markdown Message2
`
    expect(issues).toContain(expected)
  })
})
