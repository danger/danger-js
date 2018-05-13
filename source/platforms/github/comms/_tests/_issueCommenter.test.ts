import { findPositionForInlineComment } from "../issueCommenter"
import { fixturedGitHubDSL } from "../../_tests/fixturedGitHubDSL"

it("finds the position of file/line for inline comment with one chunk", async () => {
  const dsl = await fixturedGitHubDSL()
  const position = await findPositionForInlineComment(dsl.git, 9, "tsconfig.json")
  expect(position).toBe(6)
})

it("finds the position of file/line for inline comment with two chunks", async () => {
  const dsl = await fixturedGitHubDSL()
  const position = await findPositionForInlineComment(dsl.git, 28, "lib/containers/gene.js")
  expect(position).toBe(19)
})
