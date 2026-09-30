import { gitJSONToGitDSL } from "../gitJSONToGitDSL"

const createGitDSL = (before: unknown, after: unknown) =>
  gitJSONToGitDSL(
    {
      modified_files: ["config.json"],
      created_files: [],
      deleted_files: [],
      commits: [],
    },
    {
      baseSHA: "base",
      headSHA: "head",
      getFileContents: async (_path, _repo, sha) => JSON.stringify(sha === "base" ? before : after),
    }
  )

describe("JSONDiffForFile", () => {
  it("preserves falsy values on both sides of a change", async () => {
    const gitDSL = createGitDSL(
      { enabled: false, retries: 0, label: "" },
      { enabled: true, retries: 1, label: "ready" }
    )

    await expect(gitDSL.JSONDiffForFile("config.json")).resolves.toEqual({
      enabled: { before: false, after: true },
      retries: { before: 0, after: 1 },
      label: { before: "", after: "ready" },
    })
  })

  it("does not treat falsy new values as missing", async () => {
    const gitDSL = createGitDSL(
      { enabled: true, retries: 1, label: "ready" },
      { enabled: false, retries: 0, label: "" }
    )

    await expect(gitDSL.JSONDiffForFile("config.json")).resolves.toEqual({
      enabled: { before: true, after: false },
      retries: { before: 1, after: 0 },
      label: { before: "ready", after: "" },
    })
  })
})
