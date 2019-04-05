import chainsmoker, { MatchResult } from "../chainsmoker"

describe("chainsmoker", () => {
  const keyedPaths = {
    created: ["added.js", "also/added.js", "this/was/also/Added.js"],
    modified: ["changed.js", "also/changed.js", "changed.md", "this_is_changed.sh"],
    deleted: ["deleted.js", "also/deleted.md"],
  }

  const fileMatch = chainsmoker(keyedPaths)

  it.each<[string[], MatchResult<typeof keyedPaths>]>([
    [["**/*.md"], { created: false, modified: true, deleted: true }],
    [["**/*.js"], { created: true, modified: true, deleted: true }],
    [
      ["**/*[A-Z]*.js"],
      {
        created: true,
        modified: false,
        deleted: false,
      },
    ],
    [["**/*_*"], { created: false, modified: true, deleted: false }],
    [
      ["also/*", "!**/*.md"],
      {
        created: true,
        modified: true,
        deleted: false,
      },
    ],
  ])("fileMatch(%s)", (patterns, expected) => expect(fileMatch(...patterns)).toEqual(expected))

  it("tap()", () => {
    const callback = jest.fn()
    expect(fileMatch.tap(callback)("**/*.md")).toEqual({ created: false, modified: true, deleted: true })
    expect(callback).toBeCalledWith({
      created: [],
      modified: ["changed.md"],
      deleted: ["also/deleted.md"],
    })
  })

  it("debug()", () => {
    const mockConsoleLog = jest.spyOn(console, "log").mockImplementation(() => undefined)
    expect(fileMatch.debug("**/*.md")).toEqual({ created: false, modified: true, deleted: true })
    expect(mockConsoleLog).toBeCalledWith(
      JSON.stringify(
        {
          created: [],
          modified: ["changed.md"],
          deleted: ["also/deleted.md"],
        },
        undefined,
        2
      )
    )
  })
})
