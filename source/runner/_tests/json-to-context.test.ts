import { jsonToContext } from "../json-to-context"
import { CISource } from "../../ci_source/ci_source"
import { FakeCI } from "../../ci_source/providers/Fake"

jest.mock("../jsonToDSL.ts")
jest.mock("../Dangerfile")

/**
 * Mock the jsonToDSL function
 */
// tslint:disable-next-line
const jsonToDSLMock = require("../jsonToDSL")

/**
 * Mock the context for danger function
 */
// tslint:disable-next-line
const bar = require("../Dangerfile")

describe("runner/json-to-context", () => {
  let jsonString: any
  let program: any
  let context: any
  let source: CISource

  beforeEach(async () => {
    jsonToDSLMock.jsonToDSL = jest.fn(() => Promise.resolve({ danger: "" }))
    bar.contextForDanger = jest.fn(() => Promise.resolve({ danger: "" }))
    jsonString = JSON.stringify({
      danger: {
        settings: {
          github: {
            baseURL: "",
          },
          cliArgs: {},
        },
      },
    })

    program = {
      base: "develop",
    }
    source = new FakeCI({})
  })

  it("should have a function called get context", () => {
    expect(jsonToContext).toBeTruthy()
  })

  it("should return a context", async () => {
    context = await jsonToContext(jsonString, program, source)
    expect(context).toBeTruthy()
  })

  it("should set the base from the input command", async () => {
    context = await jsonToContext(jsonString, program, source)
    expect(context.danger).toEqual("")
  })

  it("should work if no base is set", async () => {
    program.base = undefined
    await jsonToContext(jsonString, program, source)
    expect(jsonToDSLMock.jsonToDSL).toHaveBeenCalledWith(
      {
        settings: {
          github: {
            baseURL: "",
          },
          cliArgs: {},
        },
      },
      { env: { pr: "327", repo: "artsy/emission" } }
    )
  })

  it("should set the base to develop", async () => {
    await jsonToContext(jsonString, program, source)
    expect(jsonToDSLMock.jsonToDSL).toHaveBeenCalledWith(
      {
        settings: {
          github: {
            baseURL: "",
          },
          cliArgs: {
            base: "develop",
          },
        },
      },
      { env: { pr: "327", repo: "artsy/emission" } }
    )
  })

  it("should call context for danger with dsl", async () => {
    await jsonToContext(jsonString, program, source)
    expect(bar.contextForDanger).toHaveBeenCalledWith({ danger: "" })
  })
})
