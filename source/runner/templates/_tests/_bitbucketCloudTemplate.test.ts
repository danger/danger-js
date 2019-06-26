import {
  emptyResults,
  failsResultsWithoutMessages,
  warnResults,
  failsResults,
  messagesResults,
  markdownResults,
  summaryResults,
  multipleSummaryResults,
} from "../../_tests/fixtures/ExampleDangerResults"
import { dangerSignaturePostfix, template, inlineTemplate } from "../bitbucketCloudTemplate"
import { DangerResults } from "../../../dsl/DangerResults"

const commitID = "e70f3d6468f61a4bef68c9e6eaba9166b096e23c"

const noEntryEmoji = "❌"
const warningEmoji = "⚠️"
const messageEmoji = "✨"

describe("generating messages for BitBucket cloud", () => {
  it("shows no sections for empty results", () => {
    const issues = template("blankID", commitID, emptyResults)
    expect(issues).not.toContain("Fails")
    expect(issues).not.toContain("Warnings")
    expect(issues).not.toContain("Messages")
  })

  it("shows no sections for results without messages", () => {
    const issues = template("blankID", commitID, failsResultsWithoutMessages)
    expect(issues).not.toContain("Fails")
    expect(issues).not.toContain("Warnings")
    expect(issues).not.toContain("Messages")
  })

  it("Shows the failing messages in a section", () => {
    const issues = template("blankID", commitID, failsResults)
    expect(issues).toContain("Fails")
    expect(issues).not.toContain("Warnings")
  })

  it("Shows the warning messages in a section", () => {
    const issues = template("blankID", commitID, warnResults)
    expect(issues).toContain("Warnings")
    expect(issues).not.toContain("Fails")
  })

  it("summary result matches snapshot", () => {
    expect(template("blankID", commitID, summaryResults)).toMatchSnapshot()
  })

  it("multiple summary result matches snapshot", () => {
    expect(template("blankID", commitID, multipleSummaryResults)).toMatchSnapshot()
  })

  it("shows a postfix message indicating the current commit ID at the time of comment", () => {
    expect(template("blankID", commitID, emptyResults)).toContain(dangerSignaturePostfix({} as DangerResults, commitID))
  })
})

describe("generating inline messages", () => {
  it("Shows the failing message", () => {
    const issues = inlineTemplate("blankID", failsResults, "File.swift", 5)
    expect(issues).toContain(`- ${noEntryEmoji} Failing message`)
    expect(issues).not.toContain(`- ${warningEmoji}`)
    expect(issues).not.toContain(`- ${messageEmoji}`)
  })

  it("Shows the warning message", () => {
    const issues = inlineTemplate("blankID", warnResults, "File.swift", 5)
    expect(issues).toContain(`- ${warningEmoji} Warning message`)
    expect(issues).not.toContain(`- ${noEntryEmoji}`)
    expect(issues).not.toContain(`- ${messageEmoji}`)
  })

  it("Shows the message", () => {
    const issues = inlineTemplate("blankID", messagesResults, "File.swift", 5)
    expect(issues).toContain(`- ${messageEmoji} Message`)
    expect(issues).not.toContain(`- ${noEntryEmoji}`)
    expect(issues).not.toContain(`- ${warningEmoji}`)
  })

  it("Shows markdowns one after another", () => {
    const issues = inlineTemplate("blankID", markdownResults, "File.swift", 5)
    const expected = `
### Short Markdown Message1

### Short Markdown Message2
`
    expect(issues).toContain(expected)
  })

  it("summary inline result matches snapshot", () => {
    expect(inlineTemplate("blankID", summaryResults, "File.swift", 5)).toMatchSnapshot()
  })
})
