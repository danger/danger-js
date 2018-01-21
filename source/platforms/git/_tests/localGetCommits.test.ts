import { formatJSON } from "../localGetCommits"

it("generates a JSON-like commit message", () => {
  expect(formatJSON).toEqual(
    '{ "sha": "%H", "parents": "%p", "author": {"name": "%an", "email": "%ae", "date": "%ai" }, "committer": {"name": "%cn", "email": "%ce", "date": "%ci" }, "message": "%s"},'
  )

  const withoutComma = formatJSON.substring(0, formatJSON.length - 1)
  expect(() => JSON.parse(withoutComma)).not.toThrow()
})
