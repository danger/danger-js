import { encodingParser } from "../encodingParser"

describe("parsing encoding", () => {
  it("handles base64", () => {
    expect(encodingParser("base64")).toEqual("base64")
  })

  it("handles utf8", () => {
    expect(encodingParser("utf8")).toEqual("utf8")
  })

  it("throws on unknown encoding", () => {
    expect(() => {
      encodingParser("unknownencoding")
    }).toThrowError()
  })
})
