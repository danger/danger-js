import {
  emptyResults,
  failsResultsWithoutMessages,
  warnResults,
  failsResults,
  summaryResults,
  messagesResults,
  customIconMessagesResults,
  multipleMessagesResults,
  markdownResults,
  inlineRegularResults,
  inlineCustomIconMessagesResults,
  inlineRegularResultsForTheSameLine,
  resultsWithCustomMeta,
} from "../../_tests/fixtures/ExampleDangerResults"
import {
  dangerSignaturePostfix,
  template as githubResultsTemplate,
  inlineTemplate as githubResultsInlineTemplate,
} from "../../templates/githubIssueTemplate"

const commitID = "e70f3d6468f61a4bef68c9e6eaba9166b096e23c"

describe("generating messages", () => {
  it("shows no tables for empty results", () => {
    const issues = githubResultsTemplate("blankID", emptyResults, commitID)
    expect(issues).not.toContain("Fails")
    expect(issues).not.toContain("Warnings")
    expect(issues).not.toContain("Messages")
  })

  it("shows no tables for results without messages", () => {
    const issues = githubResultsTemplate("blankID", failsResultsWithoutMessages, commitID)
    expect(issues).not.toContain("Fails")
    expect(issues).not.toContain("Warnings")
    expect(issues).not.toContain("Messages")
  })

  it("Shows the failing messages in a table", () => {
    const issues = githubResultsTemplate("blankID", failsResults, commitID)
    expect(issues).toContain("Fails")
    expect(issues).not.toContain("Warnings")
  })

  it("Shows the warning messages in a table", () => {
    const issues = githubResultsTemplate("blankID", warnResults, commitID)
    expect(issues).toContain("Warnings")
    expect(issues).not.toContain("Fails")
  })

  it("Uses the custom icon in the messages table", () => {
    const issues = githubResultsTemplate("blankID", customIconMessagesResults, commitID)
    expect(issues).toContain("Messages")
    expect(issues).toContain("📝")
    expect(issues).not.toContain(":book:")
    expect(issues).not.toContain("Warnings")
    expect(issues).not.toContain("Fails")
  })

  it("Mixed icon messages match snapshot", () => {
    const issues = githubResultsTemplate("blankID", multipleMessagesResults, commitID)
    expect(issues).toMatchSnapshot()
  })

  it("does not break commonmark rules around line breaks", () => {
    const issues = githubResultsTemplate("blankID", warnResults, commitID)
    expect(issues).not.toMatch(/(\r?\n){2}[ \t]+</)
  })

  it("Should include summary on top of message", () => {
    const issues = githubResultsTemplate("blankID", summaryResults, commitID)
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

  it("leaves space between <td>s to allow GitHub to render message content as markdown if the message contains any", () => {
    const issues = githubResultsTemplate(
      "example-id",
      {
        fails: [{ message: "**Failure:** Something failed!" }],
        warnings: [{ message: "_Maybe you meant to run `yarn install`?_" }],
        messages: [{ message: "```ts\nfunction add(a: number, b: number): number {\n  return a + b\n}\n```" }],
        markdowns: [{ message: "List of things:\n\n* one\n* two\n* three\n" }],
      },
      commitID
    )

    expect(issues).toMatchSnapshot()
  })

  it("avoids adding space inside the <td> for proper vertical alignment if the message does not contain any markdown", () => {
    const issues = githubResultsTemplate(
      "example-id",
      {
        fails: [],
        warnings: [],
        messages: [{ message: "no markdown here" }],
        markdowns: [],
      },
      commitID
    )

    expect(issues).toMatchSnapshot()
  })

  it("summary result matches snapshot, with a commit", () => {
    expect(githubResultsTemplate("blankID", summaryResults, commitID)).toMatchSnapshot()
  })

  it("summary result matches snapshot, without a commit", () => {
    expect(githubResultsTemplate("blankID", summaryResults)).toMatchSnapshot()
  })

  it("shows a postfix message indicating the current commit ID at the time of comment", () => {
    const issues = githubResultsTemplate("example-id", emptyResults, commitID)
    expect(issues).toContain(dangerSignaturePostfix({} as any, commitID))
  })

  it("shows a postfix message with no commit ID if not provided", () => {
    const issues = githubResultsTemplate("example-id", emptyResults)
    expect(issues).toContain(dangerSignaturePostfix({} as any))
  })

  it("handles custom names/hrefs for a platform from results", () => {
    const issues = githubResultsTemplate("example-id", resultsWithCustomMeta, commitID)
    expect(issues).toContain(resultsWithCustomMeta.meta!.runtimeHref)
    expect(issues).toContain(resultsWithCustomMeta.meta!.runtimeName)
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


  it("Shows message with custom icon", () => {
    const issues = githubResultsInlineTemplate("blankID", customIconMessagesResults, "File.swift", 10)
    expect(issues).toContain("- 📝 Message with custom icon")
    expect(issues).not.toContain("- :book:")
    expect(issues).not.toContain("- :no_entry_sign:")
    expect(issues).not.toContain("- :warning:")
  })

  it("Shows mixed messages", () => {
    const issues = githubResultsInlineTemplate("blankID", multipleMessagesResults, "File.swift", 10)
    expect(issues).toContain("- 📝 Message with custom icon")
    expect(issues).toContain("- 🔔 Message with custom icon2")
    expect(issues).toContain("- :book: Test message")
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
    const issues = githubResultsTemplate("blankID", inlineRegularResults, commitID)

    expect(issues).toMatchSnapshot()
  })

  it("Shows correct messages with custom icon for inline/regular violations", () => {
    const issues = githubResultsTemplate("blankID", inlineCustomIconMessagesResults, commitID)

    expect(issues).toMatchSnapshot()
  })

  it("Shows correct message for multiple inline violations for the same file and line", () => {
    const issues = githubResultsInlineTemplate("blankID", inlineRegularResultsForTheSameLine, "File.swift", 10)

    expect(issues).toMatchSnapshot()
  })
})
