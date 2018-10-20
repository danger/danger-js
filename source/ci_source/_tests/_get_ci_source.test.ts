import { FakeCI } from "../providers/Fake"
import DummyCI from "./fixtures/dummy_ci"
import { getCISourceForEnv, getCISourceForExternal } from "../get_ci_source"

describe(".getCISourceForEnv", () => {
  test("returns undefined if nothing is found", () => {
    const ci = getCISourceForEnv({})
    expect(ci).toBeUndefined()
  })

  test("falls back to the fake if DANGER_FAKE_CI exists", () => {
    const ci = getCISourceForEnv({ DANGER_FAKE_CI: "YES" })
    expect(ci).toBeInstanceOf(FakeCI)
  })
})

describe(".getCISourceForExternal", async () => {
  test("should resolve module relatively", async () => {
    const ci = await getCISourceForExternal({}, "./source/ci_source/_tests/fixtures/dummy_ci.js")
    expect(ci).toBeInstanceOf(DummyCI)
  })

  test("should return undefined if module resolution fails", async () => {
    const ci = await getCISourceForExternal({}, "./dummy_ci.js")
    expect(ci).toBeUndefined()
  })
})
