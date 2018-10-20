let mockDangerfilePath = ""
jest.mock("fs", () => ({ existsSync: (p: any) => p === mockDangerfilePath }))

import { dangerfilePath } from "../fileUtils"

describe("dangerfilePath", () => {
  it("should return anything passed into the program's dangerfile", () => {
    expect(dangerfilePath({ dangerfile: "123" })).toEqual("123")
  })

  it("should find a dangerfile.js if there is no program, and the .js file exists", () => {
    mockDangerfilePath = "dangerfile.js"
    expect(dangerfilePath({})).toEqual("dangerfile.js")
  })

  it("should find a dangerfile.ts if there is no program, and the .js file does not exist", () => {
    mockDangerfilePath = "dangerfile.ts"
    expect(dangerfilePath({})).toEqual("dangerfile.ts")
  })

  it("should raise if nothing exists", () => {
    mockDangerfilePath = "dangerfile.tsjs"
    expect(() => dangerfilePath({})).toThrow()
  })
})
