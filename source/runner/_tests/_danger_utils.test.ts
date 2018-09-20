import { href, sentence } from "../DangerUtils"

describe("sentence()", () => {
  it("handles falsy input", () => {
    expect(sentence(null as any)).toEqual("")
  })
  it("handles empty array", () => {
    expect(sentence([])).toEqual("")
  })
  it("handles array with one item", () => {
    expect(sentence(["Hello"])).toEqual("Hello")
  })
  it("handles array with multiple items", () => {
    expect(sentence(["This", "that", "the other thing"])).toEqual("This, that and the other thing")
  })
})

describe("href()", () => {
  it("returns null when href and text are falsy", () => {
    expect(href("", "")).toEqual(null)
  })
  it("returns just the text when the href is missing", () => {
    expect(href("", "Some text")).toEqual("Some text")
  })
  it("returns <a> tag with href as text when text is missing", () => {
    expect(href("/path/to/file", "")).toEqual(`<a href="/path/to/file">/path/to/file</a>`)
  })
  it("returns <a> tag for supplied href and text", () => {
    expect(href("http://danger.systems", "Danger")).toEqual(`<a href="http://danger.systems">Danger</a>`)
  })
})
