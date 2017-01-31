import { href, sentence } from "../DangerUtils"

describe("sentence()", () => {
  it("handles falsy input", () => {
    expect(sentence(null)).toEqual("")
  })
  it("handles empty array", () => {
    expect(sentence([])).toEqual("")
  })
  it("handles array with one item", () => {
    expect(sentence(["Hello"])).toEqual("Hello")
  })
  it("handles array with multiple items", () => {
    expect(sentence(["This", "that", "the other thing"]))
      .toEqual("This, that and the other thing")
  })
})

describe("href()", () => {
  it("returns <a> tag for supplied href and text", () => {
    expect(href("http://danger.systems", "Danger"))
      .toEqual(`<a href="http://danger.systems">Danger</a>`)
  })
  it("handles falsy input", () => {
    expect(href(null, undefined)).toEqual(`<a href="#"></a>`)
  })
})
