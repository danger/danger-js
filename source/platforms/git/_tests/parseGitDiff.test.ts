import { diffToGitJSONDSL } from "../diffToGitJSONDSL"
import { gitJSONToGitDSL } from "../gitJSONToGitDSL"

const quotedUnicodePath = "src-中文.md"
const quotedUnicodeDiff = [
  `diff --git "a/src-\\344\\270\\255\\346\\226\\207.md" "b/src-\\344\\270\\255\\346\\226\\207.md"`,
  "index 9daeafb..1091bd3 100644",
  `--- "a/src-\\344\\270\\255\\346\\226\\207.md"`,
  `+++ "b/src-\\344\\270\\255\\346\\226\\207.md"`,
  "@@ -1 +1 @@",
  "-old",
  "+new",
].join("\n")

describe("parseGitDiff", () => {
  it("decodes quoted non-ASCII paths in the file lists", () => {
    const json = diffToGitJSONDSL(quotedUnicodeDiff, [])

    expect(json.modified_files).toEqual([quotedUnicodePath])
  })

  it("decodes quoted and escaped path characters", () => {
    const path = `quote-"and-\\slash.md`
    const escapedPath = path.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
    const diff = [
      `diff --git "a/${escapedPath}" "b/${escapedPath}"`,
      "index 9daeafb..1091bd3 100644",
      `--- "a/${escapedPath}"`,
      `+++ "b/${escapedPath}"`,
      "@@ -1 +1 @@",
      "-old",
      "+new",
    ].join("\n")

    expect(diffToGitJSONDSL(diff, []).modified_files).toEqual([path])
  })
  it("lets non-ASCII paths work with the Git DSL lookups", async () => {
    const json = diffToGitJSONDSL(quotedUnicodeDiff, [])
    const requestedPaths: string[] = []
    const git = gitJSONToGitDSL(json, {
      baseSHA: "base",
      headSHA: "head",
      getFileContents: async (path) => {
        requestedPaths.push(path)
        return ""
      },
      getFullDiff: async () => quotedUnicodeDiff,
    })

    expect(git.fileMatch(quotedUnicodePath).modified).toBe(true)
    await expect(git.structuredDiffForFile(quotedUnicodePath)).resolves.toHaveProperty("chunks")
    await expect(git.diffForFile(quotedUnicodePath)).resolves.toMatchObject({
      diff: expect.stringContaining("+new"),
    })
    expect(requestedPaths).toEqual([quotedUnicodePath, quotedUnicodePath])
  })
})
