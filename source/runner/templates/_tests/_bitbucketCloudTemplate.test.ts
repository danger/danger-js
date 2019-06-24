import {
  emptyResults,
  failsResultsWithoutMessages,
  warnResults,
  failsResults,
  summaryResults,
} from "../../_tests/fixtures/ExampleDangerResults"
import { dangerSignaturePostfix, template } from "../bitbucketCloudTemplate"
import { DangerResults } from "../../../dsl/DangerResults"

const commitID = "e70f3d6468f61a4bef68c9e6eaba9166b096e23c"

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

  it("shows a postfix message indicating the current commit ID at the time of comment", () => {
    expect(template("blankID", commitID, emptyResults)).toContain(dangerSignaturePostfix({} as DangerResults, commitID))
  })
})
