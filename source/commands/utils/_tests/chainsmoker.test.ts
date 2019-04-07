import chainsmoker, { _MatchResult } from "../chainsmoker"

describe("chainsmoker", () => {
  const keyedPaths = {
    created: ["added.js", "also/added.js", "this/was/also/Added.js"],
    modified: ["changed.js", "also/changed.js", "changed.md", "this_is_changed.sh"],
    deleted: ["deleted.js", "also/deleted.md"],
  }

  const fileMatch = chainsmoker(keyedPaths)

  it.each<[string[], typeof keyedPaths, _MatchResult<typeof keyedPaths>]>([
    [
      ["**/*.md"],
      { created: [], modified: ["changed.md"], deleted: ["also/deleted.md"] },
      {
        created: false,
        modified: true,
        deleted: true,
      },
    ],
    [
      ["**/*.js"],
      {
        created: ["added.js", "also/added.js", "this/was/also/Added.js"],
        modified: ["changed.js", "also/changed.js"],
        deleted: ["deleted.js"],
      },
      {
        created: true,
        modified: true,
        deleted: true,
      },
    ],
    [
      ["**/*[A-Z]*.js"],
      {
        created: ["this/was/also/Added.js"],
        modified: [],
        deleted: [],
      },
      {
        created: true,
        modified: false,
        deleted: false,
      },
    ],
    [
      ["**/*_*"],
      {
        created: [],
        modified: ["this_is_changed.sh"],
        deleted: [],
      },
      {
        created: false,
        modified: true,
        deleted: false,
      },
    ],
    [
      ["also/*", "!**/*.md"],
      {
        created: ["also/added.js"],
        modified: ["also/changed.js"],
        deleted: [],
      },
      {
        created: true,
        modified: true,
        deleted: false,
      },
    ],
  ])("fileMatch(%s)", (patterns, keyedPaths, matchResult) => {
    const matched = fileMatch(...patterns)
    expect(matched.getKeyedPaths()).toEqual(keyedPaths)
    expect(matched).toEqual({
      ...matchResult,
      getKeyedPaths: expect.any(Function),
    })
  })
})
