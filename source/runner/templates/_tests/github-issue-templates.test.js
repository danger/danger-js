// @flow

import { emptyResults, warnResults, failsResults } from "../../_tests/ExampleDangerResults"
import githubResultsTemplate from "../../templates/github-issue-template"

describe("generating messages", () => {
  it("shows no tables for empty results", () => {
    const issues = githubResultsTemplate(emptyResults)
    expect(issues).not.toContain("Fails")
    expect(issues).not.toContain("Warnings")
    expect(issues).not.toContain("Messages")
  })

  it("Shows the failing messages in a table", () => {
    const issues = githubResultsTemplate(failsResults)
    expect(issues).toContain("Fails")
    expect(issues).not.toContain("Warnings")
  })

  it("Shows the warning messages in a table", () => {
    const issues = githubResultsTemplate(warnResults)
    expect(issues).toContain("Warnings")
    expect(issues).not.toContain("Fails")
  })
})

